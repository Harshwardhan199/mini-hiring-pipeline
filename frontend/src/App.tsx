import { AppHeader } from './components/layout/AppHeader.tsx';
import { CandidatesPage } from './components/candidates/CandidatesPage.tsx';

function App() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col antialiased selection:bg-slate-900 selection:text-white">
      <AppHeader />
      <div className="flex-1">
        <CandidatesPage />
      </div>
    </div>
  );
}

export default App;