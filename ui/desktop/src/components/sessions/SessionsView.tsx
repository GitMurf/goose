import React, { useState } from 'react';
import { View, ViewOptions } from '../../App';
import { fetchSessionDetails, type SessionDetails } from '../../sessions';
import SessionListView from './SessionListView';
import SessionHistoryView from './SessionHistoryView';
import { toastError } from '../../toasts';

interface SessionsViewProps {
  setView: (view: View, viewOptions?: ViewOptions) => void;
}

const SessionsView: React.FC<SessionsViewProps> = ({ setView }) => {
  const [selectedSession, setSelectedSession] = useState<SessionDetails | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectSession = async (sessionId: string) => {
    await loadSessionDetails(sessionId);
  };

  const loadSessionDetails = async (sessionId: string) => {
    setIsLoadingSession(true);
    setError(null);
    try {
      const sessionDetails = await fetchSessionDetails(sessionId);
      setSelectedSession(sessionDetails);
    } catch (err) {
      console.error(`Failed to load session details for ${sessionId}:`, err);
      setError('Failed to load session details. Please try again later.');
      // Keep the selected session null if there's an error
      setSelectedSession(null);

      const errorMessage = err instanceof Error ? err.message : String(err);
      toastError({
        title: 'Failed to load session. The file may be corrupted.',
        msg: 'Please try again later.',
        traceback: errorMessage,
      });
    } finally {
      setIsLoadingSession(false);
    }
  };

  const handleBackToSessions = () => {
    setSelectedSession(null);
    setError(null);
  };

  const handleResumeSession = () => {
    if (selectedSession) {
      console.log('Selected session object:', JSON.stringify(selectedSession, null, 2));

      // Get the working directory from the session metadata
      const workingDir = selectedSession.metadata.working_dir;

      if (workingDir) {
        console.log(
          `Resuming session with ID: ${selectedSession.session_id}, in working dir: ${workingDir}`
        );

        // Create a new chat window with the working directory and session ID
        window.electron.createChatWindow(
          undefined,
          workingDir,
          undefined,
          selectedSession.session_id
        );
      } else {
        // Fallback if no working directory is found
        console.error('No working directory found in session metadata');
        // We could show a toast or alert here
      }
    }
  };

  const handleRetryLoadSession = () => {
    if (selectedSession) {
      loadSessionDetails(selectedSession.session_id);
    }
  };

  // If a session is selected, show the session history view
  // Otherwise, show the sessions list view with a button to test shared sessions
  return selectedSession ? (
    <SessionHistoryView
      session={selectedSession}
      isLoading={isLoadingSession}
      error={error}
      onBack={handleBackToSessions}
      onResume={handleResumeSession}
      onRetry={handleRetryLoadSession}
    />
  ) : (
    <>
      <SessionListView setView={setView} onSelectSession={handleSelectSession} />
    </>
  );
};

export default SessionsView;
