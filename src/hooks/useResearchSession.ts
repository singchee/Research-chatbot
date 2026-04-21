import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';

import { sendMessage } from '../api/anthropic';
import { OPENING_MESSAGE, SYSTEM_PROMPT } from '../constants/systemPrompt';
import type {
  GeneratedFile,
  Message,
  ResearchSession,
  Step4Details,
  StepNumber,
  StepTransition,
  SummaryBlock,
} from '../types';

const PI_NAME = 'Dr Sing Chee TAN';

const CONFIRMATION_REGEX = /\b(yes|confirmed|proceed|looks good)\b/i;
const STEP_COMPLETE_REGEX = /step\s*([1-4])\s*complete/i;

const SITE_CODES = ['EPP', 'BMS', 'CRB', 'BUN'] as const;

const createId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const formatDateStamp = (date = new Date()) =>
  `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(
    date.getDate(),
  ).padStart(2, '0')}`;

function extractBetween(source: string, start: string, end: string) {
  const startIndex = source.indexOf(start);
  if (startIndex === -1) {
    return '';
  }
  const endIndex = source.indexOf(end, startIndex + start.length);
  if (endIndex === -1) {
    return '';
  }
  return source.slice(startIndex + start.length, endIndex).trim();
}

function detectStepBlock(content: string): SummaryBlock | null {
  const patterns = [
    { step: 1, marker: '---STEP 1 SUMMARY BLOCK---' },
    { step: 2, marker: '---STEP 2 SUMMARY BLOCK---' },
    { step: 3, marker: '---STEP 3 SUMMARY BLOCK---' },
  ] as const;

  for (const p of patterns) {
    if (content.includes(p.marker)) {
      const extracted = extractBetween(
        content,
        p.marker,
        `---END STEP ${p.step} SUMMARY BLOCK---`,
      );
      if (!extracted) {
        continue;
      }
      return { step: p.step as StepNumber, content: extracted, confirmedAt: new Date() };
    }
  }
  return null;
}

function buildSystemPrompt(base: string, summaryBlocks: SummaryBlock[]) {
  if (summaryBlocks.length === 0) {
    return base;
  }
  const injection = summaryBlocks
    .sort((a, b) => a.step - b.step)
    .map((b) => `\n[CONFIRMED STEP ${b.step} SUMMARY]\n${b.content}`)
    .join('\n');
  return `${base}\n\n═══ CONFIRMED PRIOR STEPS ═══${injection}`;
}

function inferNextStep(currentStep: StepNumber, userInput: string, assistantOutput: string): StepNumber {
  if (currentStep === 4) {
    return 4;
  }

  if (!CONFIRMATION_REGEX.test(userInput)) {
    return currentStep;
  }

  const stepMatch = assistantOutput.match(STEP_COMPLETE_REGEX);
  if (stepMatch) {
    const completedStep = Number(stepMatch[1]) as StepNumber;
    if (completedStep === currentStep) {
      return Math.min(4, currentStep + 1) as StepNumber;
    }
  }

  if (currentStep === 3 && /ready to proceed to step 4/i.test(assistantOutput)) {
    return 4;
  }

  return currentStep;
}

function addOrReplaceSummary(list: SummaryBlock[], next: SummaryBlock) {
  const filtered = list.filter((item) => item.step !== next.step);
  return [...filtered, next].sort((a, b) => a.step - b.step);
}

function parseGovernancePathway(summaryBlocks: SummaryBlock[]) {
  const step3 = summaryBlocks.find((item) => item.step === 3)?.content ?? '';
  const line =
    step3
      .split('\n')
      .find((row) => row.trim().toUpperCase().startsWith('GOVERNANCE PATHWAY:'))
      ?.toLowerCase() ?? '';

  if (line.includes('qi') || line.includes('nhore') || line.includes('pdsa')) {
    return 'C';
  }
  if (line.includes('ai') || line.includes('ml') || line.includes('model')) {
    return 'D';
  }
  if (line.includes('full')) {
    return 'A';
  }
  return 'B';
}

function parseStep3Variables(summaryBlocks: SummaryBlock[]) {
  const step3 = summaryBlocks.find((item) => item.step === 3)?.content ?? '';
  const variablesLine =
    step3
      .split('\n')
      .find((row) => row.trim().toUpperCase().startsWith('KEY VARIABLES:')) ?? '';

  if (!variablesLine) {
    return ['Variable_1', 'Variable_2', 'Variable_3'];
  }

  const raw = variablesLine.split(':').slice(1).join(':');
  const tokens = raw
    .split(/[|,]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((token) => {
      const value = token.includes('=') ? token.split('=').slice(1).join('=').trim() : token;
      return value
        .replace(/\[[^\]]+\]/g, '')
        .replace(/\s+/g, '_')
        .replace(/[^\w]/g, '')
        .slice(0, 24);
    })
    .filter(Boolean);

  return Array.from(new Set(tokens)).slice(0, 8);
}

function workbookBlob(workbook: XLSX.WorkBook) {
  const out = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([out], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

function createProjectPlanWorkbook(pathway: 'A' | 'B' | 'C' | 'D') {
  const milestoneSets: Record<'A' | 'B' | 'C' | 'D', string[]> = {
    A: [
      'Protocol',
      'HREC submission',
      'Approval',
      'Site governance',
      'Data extraction',
      'Data cleaning',
      'Analysis',
      'Manuscript',
      'Submission',
    ],
    B: [
      'Protocol',
      'HREC submission',
      'Approval',
      'Data extraction',
      'Analysis',
      'Manuscript',
      'Submission',
    ],
    C: ['NHORE registration', 'Baseline audit', 'Intervention', 'Re-audit', 'Report'],
    D: [
      'Feature engineering',
      'Model development',
      'Validation',
      'Clinical review',
      'TGA assessment',
    ],
  };

  const milestones = milestoneSets[pathway];
  const milestoneRows = [
    ['Phase', 'Milestone', 'Owner', 'Wk Start', 'Wk End', 'Duration', 'Dependencies', 'Risk'],
    ...milestones.map((milestone, idx) => [
      `Phase ${idx < 3 ? 1 : idx < 6 ? 2 : 3}`,
      milestone,
      PI_NAME,
      idx * 2 + 1,
      idx * 2 + 2,
      2,
      idx === 0 ? '' : milestones[idx - 1],
      idx > milestones.length - 3 ? 'AMBER' : 'GREEN',
    ]),
  ];

  const ganttHeader = ['Milestone', ...Array.from({ length: 20 }, (_, i) => `W${i + 1}`)];
  const ganttRows = milestones.map((milestone, idx) => {
    const start = idx * 2 + 1;
    const end = start + 1;
    const row = [milestone];
    for (let week = 1; week <= 20; week += 1) {
      row.push(week >= start && week <= end ? '■' : '');
    }
    return row;
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(milestoneRows), 'Milestones');
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([ganttHeader, ...ganttRows]),
    'Gantt Chart',
  );
  return wb;
}

function createDcsWorkbook(details: Step4Details, variables: string[]) {
  const headers = [
    'Study_ID',
    'Enrolment_Date',
    'Site',
    ...variables,
    'Data_Collector_Initials',
    'Date_Entered',
    'Comments',
  ];

  const entryRows = [headers];
  for (let i = 1; i <= 5; i += 1) {
    entryRows.push([
      `${details.studyAcronym}-${details.sites[0] ?? 'EPP'}-${String(i).padStart(4, '0')}`,
      '',
      details.sites[0] ?? '',
      ...variables.map(() => ''),
      '',
      '',
      '',
    ]);
  }

  const variableGuideRows = [
    [
      'Variable_Name',
      'Definition',
      'Format',
      'Allowable_Values',
      'Source_Dataset',
      'CRF_Section',
    ],
    ...variables.map((variable) => [variable, '', 'Text/Number', '', 'Cerner', 'Data entry']),
  ];

  const validationRows = [['SiteCodes'], ...SITE_CODES.map((code) => [code])];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(entryRows), 'Data entry');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(variableGuideRows), 'VariableGuide');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(validationRows), 'ValidationLists');
  return wb;
}

function createDldWorkbook(details: Step4Details) {
  const confidentialBanner = [
    ['⚠ CONFIDENTIAL — RE-IDENTIFICATION KEY'],
    [
      'Study_ID',
      'Surname',
      'First_Name',
      'UR_Number',
      'Enrolment_Date',
      'Withdrawal_Date',
      'Withdrawal_Reason',
      'Added_By',
      'Date_Added',
      'Notes',
    ],
    [
      `${details.studyAcronym}-${details.sites[0] ?? 'EPP'}-0001`,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
    ],
  ];

  const accessLogRows = [['Timestamp', 'User', 'Action', 'Details'], [new Date().toISOString(), '', '', '']];
  const versionRows = [['Version', 'Date', 'Author', 'Notes'], ['v1.0', new Date().toISOString(), PI_NAME, 'Initial version']];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(confidentialBanner), 'DLD');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(accessLogRows), 'AccessLog');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(versionRows), 'VersionHistory');
  return wb;
}

function shouldPromptStep4Modal(content: string) {
  return (
    /_ProjectPlan_v1\.0_/i.test(content) ||
    /_DCS_v1\.0_/i.test(content) ||
    /_DLD_v1\.0_/i.test(content)
  );
}

function getDocxFilename(content: string) {
  const match = content.match(/([A-Za-z0-9[\]]{2,12}_InceptionReport_v1\.0_[A-Za-z0-9[\]-]+\.docx)/i);
  return match?.[1] ?? null;
}

export function useResearchSession() {
  const [session, setSession] = useState<ResearchSession>({
    currentStep: 1,
    messages: [
      {
        id: createId(),
        role: 'assistant',
        content: OPENING_MESSAGE,
        timestamp: new Date(),
        stepContext: 1,
      },
    ],
    summaryBlocks: [],
    piName: PI_NAME,
    sessionStarted: new Date(),
  });
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lastUserInput, setLastUserInput] = useState<string | null>(null);
  const [retryMessages, setRetryMessages] = useState<Message[] | null>(null);
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [stepTransitions, setStepTransitions] = useState<StepTransition[]>([]);
  const [isStep4ModalOpen, setIsStep4ModalOpen] = useState(false);
  const [step4Details, setStep4Details] = useState<Step4Details>({
    studyAcronym: '',
    sites: ['EPP'],
    enrolment: '',
    coInvestigators: '',
  });

  const latestSummaryBlock = useMemo(
    () => [...session.summaryBlocks].sort((a, b) => b.step - a.step)[0] ?? null,
    [session.summaryBlocks],
  );

  const canGenerateStep4Files =
    step4Details.studyAcronym.length >= 2 &&
    step4Details.studyAcronym.length <= 6 &&
    step4Details.sites.length > 0 &&
    Number(step4Details.enrolment) > 0 &&
    step4Details.coInvestigators.trim().length > 0;

  const appendAssistantMessage = (baseMessages: Message[], content: string, userInput: string) => {
    const assistantMessage: Message = {
      id: createId(),
      role: 'assistant',
      content,
      timestamp: new Date(),
      stepContext: session.currentStep,
    };

    let nextStep = session.currentStep;
    let nextSummaries = session.summaryBlocks;
    const transitionEvents: StepTransition[] = [];

    const summary = detectStepBlock(content);
    if (summary) {
      nextSummaries = addOrReplaceSummary(session.summaryBlocks, summary);
    }

    const inferredStep = inferNextStep(session.currentStep, userInput, content);
    if (inferredStep !== session.currentStep) {
      transitionEvents.push({
        id: createId(),
        from: session.currentStep,
        to: inferredStep,
        afterMessageId: assistantMessage.id,
      });
      nextStep = inferredStep;
    }

    const derivedAcronym =
      session.studyAcronym ?? (step4Details.studyAcronym ? step4Details.studyAcronym : undefined);

    const nextSession: ResearchSession = {
      ...session,
      currentStep: nextStep,
      messages: [...baseMessages, assistantMessage],
      summaryBlocks: nextSummaries,
      studyAcronym: derivedAcronym,
    };

    setSession(nextSession);
    if (transitionEvents.length > 0) {
      setStepTransitions((prev) => [...prev, ...transitionEvents]);
    }

    const docxFilename = getDocxFilename(content);
    if (docxFilename) {
      const docBlob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      setGeneratedFiles((prev) => {
        if (prev.some((item) => item.filename === docxFilename)) {
          return prev;
        }
        return [
          ...prev,
          {
            filename: docxFilename,
            type: 'docx',
            blob: docBlob,
            note: 'Copy this content into your Word template for final formatting.',
          },
        ];
      });
    }

    if (shouldPromptStep4Modal(content)) {
      setIsStep4ModalOpen(true);
    }
  };

  const requestAssistant = async (baseMessages: Message[], userInput: string) => {
    setIsStreaming(true);
    setStreamingContent('');
    setError(null);

    const apiMessages = baseMessages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    try {
      const responseText = await sendMessage(
        apiMessages,
        buildSystemPrompt(SYSTEM_PROMPT, session.summaryBlocks),
        (chunk) => setStreamingContent((prev) => prev + chunk),
      );
      appendAssistantMessage(baseMessages, responseText, userInput);
      setRetryMessages(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error while contacting Anthropic.');
      setRetryMessages(baseMessages);
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
    }
  };

  const sendUserMessage = async (input: string) => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) {
      return;
    }

    const userMessage: Message = {
      id: createId(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
      stepContext: session.currentStep,
    };

    const nextMessages = [...session.messages, userMessage];
    setSession((prev) => ({ ...prev, messages: nextMessages }));
    setLastUserInput(trimmed);
    await requestAssistant(nextMessages, trimmed);
  };

  const retryLastRequest = async () => {
    if (!retryMessages || !lastUserInput || isStreaming) {
      return;
    }
    await requestAssistant(retryMessages, lastUserInput);
  };

  const dismissError = () => setError(null);

  const dismissStep4Modal = () => setIsStep4ModalOpen(false);

  const generateStep4Files = () => {
    if (!canGenerateStep4Files) {
      return;
    }

    const acronym = step4Details.studyAcronym.toUpperCase();
    const stamp = formatDateStamp();
    const pathway = parseGovernancePathway(session.summaryBlocks);
    const variables = parseStep3Variables(session.summaryBlocks);

    const projectPlanFile: GeneratedFile = {
      filename: `${acronym}_ProjectPlan_v1.0_${stamp}.xlsx`,
      type: 'xlsx',
      blob: workbookBlob(createProjectPlanWorkbook(pathway)),
    };

    const dcsFile: GeneratedFile = {
      filename: `${acronym}_DCS_v1.0_${stamp}.xlsx`,
      type: 'xlsx',
      blob: workbookBlob(createDcsWorkbook({ ...step4Details, studyAcronym: acronym }, variables)),
    };

    const dldFile: GeneratedFile = {
      filename: `${acronym}_DLD_v1.0_${stamp}.xlsx`,
      type: 'xlsx',
      blob: workbookBlob(createDldWorkbook({ ...step4Details, studyAcronym: acronym })),
    };

    setGeneratedFiles((prev) => {
      const keyed = new Map(prev.map((item) => [item.filename, item]));
      keyed.set(projectPlanFile.filename, projectPlanFile);
      keyed.set(dcsFile.filename, dcsFile);
      keyed.set(dldFile.filename, dldFile);
      return Array.from(keyed.values());
    });

    const custodyMessage: Message = {
      id: createId(),
      role: 'assistant',
      timestamp: new Date(),
      stepContext: 4,
      content: `⚠ DATA ARTEFACT CUSTODY NOTICE

DCS: Study ID only — no patient identifiers. Share with data collectors.
Store in study shared drive. Ethics amendment required if variables are added
or removed (major version).

DLD: CONFIDENTIAL — RE-IDENTIFICATION KEY. Store SEPARATELY from DCS and all
analysis files. PI and named custodian access only. Never email. Every new
participant = new minor version (rename file).

Both documents: retain minimum 15 years post-study closure.`,
    };

    setSession((prev) => ({
      ...prev,
      studyAcronym: acronym,
      currentStep: 4,
      messages: [...prev.messages, custodyMessage],
    }));
    setIsStep4ModalOpen(false);
  };

  const downloadFile = (file: GeneratedFile) => {
    const url = URL.createObjectURL(file.blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = file.filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const userHasMessaged = session.messages.some((message) => message.role === 'user');

  return {
    session,
    isStreaming,
    streamingContent,
    error,
    generatedFiles,
    stepTransitions,
    latestSummaryBlock,
    isStep4ModalOpen,
    step4Details,
    canGenerateStep4Files,
    userHasMessaged,
    sendUserMessage,
    retryLastRequest,
    dismissError,
    dismissStep4Modal,
    setStep4Details,
    generateStep4Files,
    downloadFile,
  };
}
