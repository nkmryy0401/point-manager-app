import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainPage from "./MainPage";
import SettingsPage from "./SettingsPage";
import HistoryPage from "./HistoryPage"; // ✅ これがあるか

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<MainPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/history" element={<HistoryPage />} /> {/* ✅ これが重要 */}
            </Routes>
        </Router>
    );
}

export default App;
