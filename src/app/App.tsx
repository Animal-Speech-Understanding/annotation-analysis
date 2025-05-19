import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RegionSelectionPage } from "@pages/region-selection";
import { HomePage } from "@pages/home";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/region-selection/:audioId" element={<RegionSelectionPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
