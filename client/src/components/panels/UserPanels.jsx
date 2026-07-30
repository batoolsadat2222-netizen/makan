import { useApp } from '../../context/AppContext';
import PanelShell from './PanelShell';
import LoginPanel from './LoginPanel';
import RegisterPanel from './RegisterPanel';
import HistoryPanel from './HistoryPanel';
import SettingsPanel from './SettingsPanel';
import HelpPanel from './HelpPanel';
import AboutPanel from './AboutPanel';
import ContactPanel from './ContactPanel';
import ProfilePanel from './ProfilePanel';
import AnalyticsPanel from './AnalyticsPanel';
import AdminPanel from './AdminPanel';

const PANEL_MAP = {
  login: LoginPanel,
  register: RegisterPanel,
  history: HistoryPanel,
  analytics: AnalyticsPanel,
  admin: AdminPanel,
  settings: SettingsPanel,
  help: HelpPanel,
  about: AboutPanel,
  contact: ContactPanel,
  profile: ProfilePanel,
};

export default function UserPanels() {
  const { activePanel, closePanel } = useApp();

  if (!activePanel || !PANEL_MAP[activePanel]) return null;

  const Panel = PANEL_MAP[activePanel];

  return (
    <PanelShell panelId={activePanel} onClose={closePanel}>
      <Panel />
    </PanelShell>
  );
}
