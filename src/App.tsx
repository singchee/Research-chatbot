import { ChatThread } from './components/ChatThread';
import { InputBar } from './components/InputBar';
import { Step4ConfirmationModal } from './components/Step4ConfirmationModal';
import { StepSidebar } from './components/StepSidebar';
import { SummaryPanel } from './components/SummaryPanel';
import { useResearchSession } from './hooks/useResearchSession';

function App() {
  const {
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
  } = useResearchSession();

  return (
    <div className="flex h-full min-h-screen w-full overflow-hidden bg-[var(--surface)]">
      <StepSidebar session={session} />

      <main className="flex min-w-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-hidden">
          {userHasMessaged ? (
            <ChatThread
              messages={session.messages}
              transitions={stepTransitions}
              generatedFiles={generatedFiles}
              error={error}
              onRetry={retryLastRequest}
              onDismissError={dismissError}
              isStreaming={isStreaming}
              streamingContent={streamingContent}
              onDownloadFile={downloadFile}
            />
          ) : (
            <section className="flex h-full flex-col items-center justify-center px-8 text-center">
              <p className="text-4xl font-bold tracking-tight text-[var(--nh-navy)]">Northern Health</p>
              <p className="mt-2 text-sm uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Research Assistant
              </p>
              <p className="mt-6 max-w-xl text-base text-[var(--text-muted)]">
                Start by describing your research idea below.
              </p>
            </section>
          )}
        </div>
        <InputBar
          disabled={isStreaming}
          showExampleChips={!userHasMessaged}
          onSend={sendUserMessage}
        />
      </main>

      <SummaryPanel summaryBlock={latestSummaryBlock} />

      <Step4ConfirmationModal
        isOpen={isStep4ModalOpen}
        details={step4Details}
        canGenerate={canGenerateStep4Files}
        onClose={dismissStep4Modal}
        onGenerate={generateStep4Files}
        onChange={setStep4Details}
      />
    </div>
  );
}

export default App;
