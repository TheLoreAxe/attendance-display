import { useEffect, useState, useCallback, useRef } from "react";
import "./App.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

type OfficeData = {
  office: string;
  count: number;
  percent: number;
};

type AwardData = {
  award: string;
  recipient: string;
  office?: string;
};

const CORE_BLUE = getComputedStyle(document.documentElement)
  .getPropertyValue("--brand-blue")
  .trim();

const CORE_YELLOW = getComputedStyle(document.documentElement)
  .getPropertyValue("--core-yellow")
  .trim();

const HAR_CORAL = getComputedStyle(document.documentElement)
  .getPropertyValue("--har-coral")
  .trim();

const SHEET_ID = "1U42R7534pjjocbuap8JKrPvBPlY4IAs8pSsq7Whd4k4";
const API_KEY = "AIzaSyDdUVN3znMFnQ9LPvRfq42pwny7RZ9xBDI";

const PAGE_CONFIGS = {
  core: {
    range: "TradeshowCOREAttendance!A:D",
    header: "Tailgating Scoreboard",
    type: "chart",
    secondaryColor: CORE_YELLOW,
  },
  har: {
    range: "TradeshowHARAttendance!A:D",
    header: "Tailgating Scoreboard",
    type: "chart",
    secondaryColor: HAR_CORAL,
  },
  awards: {
    range: "Awards!A:C",
    header: "Tailgating Stats",
    type: "list",
    secondaryColor: "none",
  },
};

export default function AttendanceDisplay() {
  const [coreData, setCoreData] = useState<OfficeData[]>([]);
  const [harData, setHarData] = useState<OfficeData[]>([]);
  const [awardData, setAwardData] = useState<AwardData[]>([]);
  const [mode, setMode] = useState<"total" | "percent">("total");
  const [currentPage, setCurrentPage] = useState<"core" | "har" | "awards">("core");
  const [showHAR, setShowHAR] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const latestRequestId = useRef(0);

  const areOfficeDataEqual = (a: OfficeData[], b: OfficeData[]) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (
        a[i].office !== b[i].office ||
        a[i].count !== b[i].count ||
        a[i].percent !== b[i].percent
      ) {
        return false;
      }
    }
    return true;
  };

  const areAwardsEqual = (a: AwardData[], b: AwardData[]) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (
        a[i].award !== b[i].award ||
        a[i].recipient !== b[i].recipient ||
        (a[i].office || "") !== (b[i].office || "")
      ) {
        return false;
      }
    }
    return true;
  };

  const fetchData = useCallback(async () => {
    const requestId = ++latestRequestId.current;
    const currentConfig = PAGE_CONFIGS[currentPage];
    
    if (currentConfig.type === "list") {
      try {
        const res = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${currentConfig.range}?key=${API_KEY}`
        );
        const json = await res.json();
        if (requestId !== latestRequestId.current) return; // stale
        if (!json.values) return;
        const rows = json.values.slice(1);
        const processed: AwardData[] = rows.map(
          ([award, recipient, office]: [string, string, string]) => ({
            award: award || "",
            recipient: recipient || "",
            office: office || "",
          })
        );
        setAwardData((prev) => (areAwardsEqual(prev, processed) ? prev : processed));
      } catch (err) {
        console.warn("Failed to fetch awards data", err);
      }
    } else {
      try {
        const res = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${currentConfig.range}?key=${API_KEY}`
        );
        const json = await res.json();
        if (requestId !== latestRequestId.current) return; // stale
        if (!json.values) return;
        const rows = json.values.slice(1);
        const processed: OfficeData[] = rows.map(
          ([office, count, , percent]: [string, string, string, string]) => ({
            office,
            count: parseInt(count || "0", 10),
            percent: parseFloat(percent || "0"),
          })
        );
        if (mode === "total") {
          processed.sort((a, b) => b.count - a.count);
        } else {
          processed.sort((a, b) => b.percent - a.percent);
        }
        if (currentPage === "core") {
          setCoreData((prev) => (areOfficeDataEqual(prev, processed) ? prev : processed));
        } else if (currentPage === "har") {
          setHarData((prev) => (areOfficeDataEqual(prev, processed) ? prev : processed));
        }
        // Keep legacy state empty to avoid accidental render usage
      } catch (err) {
        console.warn("Failed to fetch chart data", err);
      }
    }
  }, [mode, currentPage]);

  const currentChartData = currentPage === "core" ? coreData : currentPage === "har" ? harData : [];

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Page rotation effect
  useEffect(() => {
    if (isPaused) return; // Don't rotate when paused
    
    const pageInterval = setInterval(() => {
      setCurrentPage((prev) => {
        if (prev === "core") {
          return showHAR ? "har" : "awards";
        }
        if (prev === "har") {
          return "awards";
        }
        return "core";
      });
    }, 10000); // 10 seconds

    return () => clearInterval(pageInterval);
  }, [showHAR, isPaused]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        // Navigate to previous slide
        if (currentPage === "core") {
          setCurrentPage(showHAR ? "awards" : "awards");
        } else if (currentPage === "har") {
          setCurrentPage("core");
        } else {
          setCurrentPage(showHAR ? "har" : "core");
        }
      } else if (event.key === "ArrowRight") {
        // Navigate to next slide
        if (currentPage === "core") {
          setCurrentPage(showHAR ? "har" : "awards");
        } else if (currentPage === "har") {
          setCurrentPage("awards");
        } else {
          setCurrentPage("core");
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentPage, showHAR]);

  const maxValue =
    mode === "total"
      ? Math.max(...currentChartData.map((d) => d.count), 1)
      : 100;

  const BAR_LEFT_OFFSET_PX = 6;
  const renderBarShape = (props: unknown) => {
    const { x, y, width, height, fill } = (props as BarShapeProps);
    const adjustedX = (x ?? 0) + BAR_LEFT_OFFSET_PX;
    const adjustedWidth = Math.max(0, (width ?? 0) - BAR_LEFT_OFFSET_PX);
    return (
      <rect x={adjustedX} y={y} width={adjustedWidth} height={height} fill={fill} rx={4} ry={4} />
    );
  };

  const renderValueLabel = (props: unknown) => {
    const { x, y, width, height, value } = (props as { x?: number; y?: number; width?: number; height?: number; value?: number; });
    const labelX = (x ?? 0) + (width ?? 0) + 8;
    const labelY = (y ?? 0) + (height ?? 0) / 2;
    const text = mode === "percent" ? `${value ?? 0}%` : `${value ?? 0}`;
    return (
      <text x={labelX} y={labelY} fill={CORE_BLUE} fontSize={14} fontWeight={800} dominantBaseline="middle">{text}</text>
    );
  };

  const currentConfig = PAGE_CONFIGS[currentPage];

  const renderAwardsList = () => {
    const awardCount = awardData.length;
    let gridClass = '';
    
    if (awardCount <= 3) {
      gridClass = 'awards-grid-3';
    } else if (awardCount === 4) {
      gridClass = 'awards-grid-4';
    } else if (awardCount === 5) {
      gridClass = 'awards-grid-5';
    } else {
      gridClass = 'awards-grid-6';
    }

    return (
      <div className={`awards-container ${gridClass}`}>
        {awardData.map((award, index) => (
          <div key={index} className="award-item">
            <div className="award-name">{award.award}</div>
            <div className="award-recipient">{award.recipient}</div>
            {award.office && <div className="award-office">{award.office}</div>}
          </div>
        ))}
      </div>
    );
  };

  const renderChart = (secondaryColor: string) => (
    <ResponsiveContainer width="90%" height="70%">
      <BarChart
        data={currentChartData}
        layout="vertical"
        margin={{ top: 20, right: 24, left: 16, bottom: 20 }}
      >
        <XAxis
          type="number"
          domain={[0, maxValue]}
          tick={{ fill: CORE_BLUE, fontSize: 14 }}
          tickFormatter={(value: number) => (mode === "total" ? `${value}` : `${value}%`)}
        />
        <YAxis
          type="category"
          dataKey="office"
          width={280}
          tick={{ fill: CORE_BLUE, fontSize: 22, fontWeight: 800 }}
          tickMargin={16}
          tickLine={false}
          axisLine={{ stroke: CORE_BLUE }}
          interval={0}
        />
        <Tooltip
          contentStyle={{ backgroundColor: secondaryColor, color: CORE_BLUE }}
        />
        <Bar
          dataKey={mode === "total" ? "count" : "percent"}
          fill={CORE_YELLOW}
          barSize={34}
          shape={renderBarShape}
          isAnimationActive={false}
        >
            {currentChartData.map((d) => (
              <Cell key={`cell-${d.office}`} fill={secondaryColor} />
            ))}
          <LabelList dataKey={mode === "total" ? "count" : "percent"} content={renderValueLabel} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <div className="app-shell">
      <div className="quick-controls">
        <div className="main-controls">
          <button
            onClick={() => setMode("total")}
            className={mode === "total" ? "active" : ""}
          >
            Total
          </button>
          <button
            onClick={() => setMode("percent")}
            className={mode === "percent" ? "active" : ""}
          >
            %
          </button>
        </div>
        
        <div className="secondary-controls">
          <button
            onClick={() => setShowHAR(!showHAR)}
            className={`har-toggle ${showHAR ? "active" : ""}`}
            title="Toggle HAR Office Scoreboard"
          >
            H
          </button>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`pause-toggle ${isPaused ? "active" : ""}`}
            title={isPaused ? "Resume rotation" : "Pause rotation"}
          >
            {isPaused ? "▶" : "⏸"}
          </button>
        </div>
      </div>

      <header className="page-header">
        <h1>{currentConfig.header}</h1>
      </header>

      <div className="chart-container">
        <button
          className="nav-arrow nav-left"
          onClick={() => {
            if (currentPage === "core") {
              setCurrentPage(showHAR ? "awards" : "awards");
            } else if (currentPage === "har") {
              setCurrentPage("core");
            } else {
              setCurrentPage(showHAR ? "har" : "core");
            }
          }}
          title="Previous slide"
        >
          ‹
        </button>
        
        {currentConfig.type === "list" ? renderAwardsList() : renderChart(currentConfig.secondaryColor)}
        
        <button
          className="nav-arrow nav-right"
          onClick={() => {
            if (currentPage === "core") {
              setCurrentPage(showHAR ? "har" : "awards");
            } else if (currentPage === "har") {
              setCurrentPage("awards");
            } else {
              setCurrentPage("core");
            }
          }}
          title="Next slide"
        >
          ›
        </button>
      </div>
    </div>
  );
}

type BarShapeProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
};
