import { useState } from "react";
import { ClickAnnotationPage } from "@pages/click-annotation";
import { RegionSelectionPage } from "@pages/region-selection";
import { WaveformTestPage } from "@pages/waveform-test";

function App() {
  const [currentPage, setCurrentPage] = useState<"annotation" | "region" | "waveform-test">("region");

  return (
    <>
      <nav style={{
        padding: "10px 20px",
        backgroundColor: "#f0f0f0",
        marginBottom: "20px",
        display: "flex",
        gap: "20px"
      }}>
        <button
          onClick={() => setCurrentPage("annotation")}
          style={{
            padding: "8px 16px",
            background: currentPage === "annotation" ? "purple" : "#e0e0e0",
            color: currentPage === "annotation" ? "white" : "black",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Annotation
        </button>
        <button
          onClick={() => setCurrentPage("region")}
          style={{
            padding: "8px 16px",
            background: currentPage === "region" ? "purple" : "#e0e0e0",
            color: currentPage === "region" ? "white" : "black",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Region Selection
        </button>
        <button
          onClick={() => setCurrentPage("waveform-test")}
          style={{
            padding: "8px 16px",
            background: currentPage === "waveform-test" ? "purple" : "#e0e0e0",
            color: currentPage === "waveform-test" ? "white" : "black",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Waveform Test
        </button>
      </nav>

      {currentPage === "annotation" ? <ClickAnnotationPage /> :
        currentPage === "region" ? <RegionSelectionPage /> :
          <WaveformTestPage />}
    </>
  );
}

export default App;
