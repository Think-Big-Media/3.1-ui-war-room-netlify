import { useEffect } from "react";
import PageLayout from "../components/shared/PageLayout";
import { useBackgroundClasses } from "../contexts/BackgroundThemeContext";
import "../v2-dashboard.css";

export default function V2Dashboard() {
  const { baseClass, overlayClass } = useBackgroundClasses();
  
  useEffect(() => {
    // Add a small delay to ensure elements are rendered
    const timeout = setTimeout(() => {
      // DEBUG: Check phrase cloud elements and styles
      const phraseCarousel = document.querySelector('.phrase-carousel');
      const phraseItems = document.querySelectorAll('.phrase-item');
      
      console.log('🔍 PHRASE CLOUD DEBUG:');
      console.log('Phrase carousel element:', phraseCarousel);
      console.log('Number of phrase items:', phraseItems.length);
      
      if (phraseCarousel) {
        const carouselStyles = window.getComputedStyle(phraseCarousel);
        console.log('Carousel transform-style:', carouselStyles.transformStyle);
        console.log('Carousel position:', carouselStyles.position);
        console.log('Carousel dimensions:', {
          width: carouselStyles.width,
          height: carouselStyles.height,
          left: carouselStyles.left
        });
      }
      
      phraseItems.forEach((item, index) => {
        const styles = window.getComputedStyle(item);
        console.log(`Phrase ${index + 1}:`, {
          position: styles.position,
          transform: styles.transform,
          animation: styles.animation,
          animationDelay: styles.animationDelay,
          top: styles.top,
          left: styles.left,
          zIndex: styles.zIndex
        });
      });

      // Interactive SWOT radar to Live Intelligence connection
      const blobContainers = document.querySelectorAll(".radar-blob-container");
      const feedWrapper = document.getElementById("feedWrapper");
      let animationTimeout: NodeJS.Timeout | null = null;
      
      console.log('V2Dashboard: Found blob containers:', blobContainers.length);
      console.log('V2Dashboard: Found feedWrapper:', !!feedWrapper);

    blobContainers.forEach((blob) => {
      blob.addEventListener("click", function () {
        const feedId = this.getAttribute("data-feed-id");
        if (!feedId) return;

        // Clear any existing timeout
        if (animationTimeout) {
          clearTimeout(animationTimeout);
        }

        // Find matching feed item
        const feedItems = feedWrapper?.querySelectorAll(".feed-item");
        let targetItem: Element | null = null;

        feedItems?.forEach((item) => {
          item.classList.remove("highlighted");
          if (item.getAttribute("data-id") === feedId && !targetItem) {
            targetItem = item;
          }
        });

        if (targetItem && feedWrapper) {
          // Stop animation
          feedWrapper.classList.add("paused");
          (feedWrapper as HTMLElement).style.animationPlayState = "paused";

          // Scroll to put item at top
          (feedWrapper as HTMLElement).style.transition = "transform 0.5s ease";
          (feedWrapper as HTMLElement).style.transform =
            `translateY(-${(targetItem as HTMLElement).offsetTop}px)`;

          // Highlight after scroll
          setTimeout(() => {
            targetItem?.classList.add("highlighted");
          }, 200);
        }
      });

      blob.addEventListener("mouseleave", function () {
        animationTimeout = setTimeout(() => {
          const highlightedItem = feedWrapper?.querySelector(
            ".feed-item.highlighted",
          );
          if (highlightedItem) {
            highlightedItem.classList.remove("highlighted");
          }

          if (feedWrapper) {
            feedWrapper.classList.remove("paused");
            (feedWrapper as HTMLElement).style.animationPlayState = "";
            (feedWrapper as HTMLElement).style.transition = "";
            (feedWrapper as HTMLElement).style.transform = "";
          }
        }, 500);
      });
    });

    }, 100); // Small delay to ensure DOM is ready

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  return (
    <PageLayout 
      pageTitle="Campaign Intelligence" 
      placeholder="Ask about your campaign intelligence..."
    >
      {/* Dynamic Background Theme System */}
      <div className={`fixed inset-0 ${baseClass} -z-10`} />
      {overlayClass && <div className={`fixed inset-0 ${overlayClass} -z-10`} />}
      
      <div className="war-room-dashboard">
      <div
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", sans-serif',
        }}
      >
      {/* Main Dashboard Wrapper */}
      <div className="dashboard-wrapper">
        <div className="dashboard">
          {/* Left Column */}
          <div className="left-column">
            {/* Political Map - NO TITLE */}
            <div className="card political-map">
              <div className="map-container">
                <div className="map-visual">
                  {/* Political Map Image */}
                  <img
                    src="https://p129.p0.n0.cdn.zight.com/items/BluAK9rN/cb190d20-eec7-4e05-8969-259b1dbd9d69.png?source=client&v=6826eb6cb151acf76bf79d55b23b9628"
                    alt="Political Map"
                    className="electoral-map-svg"
                    style={{
                      width: "90%",
                      height: "90%",
                      objectFit: "contain",
                    }}
                  />
                </div>
                <div className="map-data">
                  <div
                    style={{
                      fontSize: "9px",
                      color: "#64748b",
                      marginBottom: "5px",
                    }}
                  >
                    SWING STATES
                  </div>
                  <div className="map-data-item">• Pennsylvania: +2.3% D</div>
                  <div className="map-data-item">• Michigan: -1.2% R</div>
                  <div className="map-data-item">• Wisconsin: TOSS UP</div>
                  <div className="map-data-item">• Arizona: +0.8% R</div>
                  <div className="map-data-item">• Georgia: +1.5% D</div>
                  <div className="map-data-item">• Nevada: TOSS UP</div>
                  <div className="map-data-item">• Florida: +3.2% R</div>
                </div>
              </div>
            </div>

            {/* SWOT Radar + Live Intelligence - ALIGNED */}
            <div className="card swot-intelligence">
              <div className="swot-radar">
                <div className="radar-container">
                  <div className="radar-sweep"></div>
                  {/* Quadrant Labels */}
                  <div
                    className="radar-quadrant"
                    style={{ top: "15px", right: "15px" }}
                  >
                    STRENGTHS
                  </div>
                  <div
                    className="radar-quadrant"
                    style={{ top: "15px", left: "15px" }}
                  >
                    WEAKNESSES
                  </div>
                  <div
                    className="radar-quadrant"
                    style={{ bottom: "15px", right: "15px" }}
                  >
                    OPPORTUNITIES
                  </div>
                  <div
                    className="radar-quadrant"
                    style={{ bottom: "15px", left: "15px" }}
                  >
                    THREATS
                  </div>

                  {/* Radar Blobs with Labels */}
                  <div
                    className="radar-blob-container"
                    style={{
                      width: "24px",
                      height: "24px",
                      top: "25%",
                      right: "30%",
                    }}
                    data-feed-id="brand-recognition"
                  >
                    <div className="radar-blob blob-strength"></div>
                    <div className="blob-label">Brand Recognition +18%</div>
                  </div>
                  <div
                    className="radar-blob-container"
                    style={{
                      width: "18px",
                      height: "18px",
                      top: "35%",
                      right: "20%",
                    }}
                    data-feed-id="youth-engagement"
                  >
                    <div className="radar-blob blob-strength"></div>
                    <div className="blob-label">Youth Engagement +23%</div>
                  </div>
                  <div
                    className="radar-blob-container"
                    style={{
                      width: "20px",
                      height: "20px",
                      top: "30%",
                      left: "25%",
                    }}
                    data-feed-id="ad-fatigue"
                  >
                    <div className="radar-blob blob-weakness"></div>
                    <div className="blob-label">Ad Fatigue Detected</div>
                  </div>
                  <div
                    className="radar-blob-container"
                    style={{
                      width: "26px",
                      height: "26px",
                      bottom: "35%",
                      right: "35%",
                    }}
                    data-feed-id="wisconsin-opens"
                  >
                    <div className="radar-blob blob-opportunity"></div>
                    <div className="blob-label">Wisconsin Opens +34%</div>
                  </div>
                  <div
                    className="radar-blob-container"
                    style={{
                      width: "19px",
                      height: "19px",
                      bottom: "25%",
                      right: "22%",
                    }}
                    data-feed-id="fl-suburbs"
                  >
                    <div className="radar-blob blob-opportunity"></div>
                    <div className="blob-label">FL Suburbs +12%</div>
                  </div>
                  <div
                    className="radar-blob-container"
                    style={{
                      width: "22px",
                      height: "22px",
                      bottom: "30%",
                      left: "30%",
                    }}
                    data-feed-id="competitor-launch"
                  >
                    <div className="radar-blob blob-threat"></div>
                    <div className="blob-label">Competitor $250K Launch</div>
                  </div>
                  <div
                    className="radar-blob-container"
                    style={{
                      width: "16px",
                      height: "16px",
                      bottom: "40%",
                      left: "20%",
                    }}
                    data-feed-id="viral-negative"
                  >
                    <div className="radar-blob blob-threat"></div>
                    <div className="blob-label">Viral Negative 12K RT</div>
                  </div>
                </div>
                <div className="radar-stats">
                  Active Threats: 2 • Opportunities: 4 • Risk Level: Medium
                  <br />
                  Radar Sweep: 12s • Detection Rate: 97%
                </div>
              </div>

              <div className="live-intelligence">
                <div className="card-title">LIVE INTELLIGENCE</div>
                <div className="feed-container" id="feedContainer">
                  <div className="feed-items-wrapper" id="feedWrapper">
                    <div className="feed-item info" data-id="wisconsin-opens">
                      <span>
                        <strong>UPDATE:</strong> Wisconsin voter registration up
                        34%.
                      </span>
                    </div>
                    <div className="feed-item warning">
                      <span>
                        <strong>WARNING:</strong> Major news outlet published
                        critical article.
                      </span>
                    </div>
                    <div className="feed-item info" data-id="fl-suburbs">
                      <span>
                        <strong>INFO:</strong> Positive sentiment in Florida
                        suburbs +12%.
                      </span>
                    </div>
                    <div
                      className="feed-item critical"
                      data-id="viral-negative"
                    >
                      <span>
                        <strong>CRITICAL:</strong> Viral negative mention
                        detected. 12K retweets in PA.
                      </span>
                    </div>
                    <div
                      className="feed-item warning"
                      data-id="competitor-launch"
                    >
                      <span>
                        <strong>WARNING:</strong> Competitor launched $250K ad
                        campaign.
                      </span>
                    </div>
                    <div className="feed-item info" data-id="youth-engagement">
                      <span>
                        <strong>INFO:</strong> Youth voter engagement up 23% in
                        Michigan.
                      </span>
                    </div>
                    <div className="feed-item info">
                      <span>
                        <strong>UPDATE:</strong> Meta ads performing 52% above
                        benchmark.
                      </span>
                    </div>
                    <div className="feed-item warning" data-id="ad-fatigue">
                      <span>
                        <strong>ALERT:</strong> Ad fatigue detected in target
                        demographics.
                      </span>
                    </div>
                    <div className="feed-item info" data-id="brand-recognition">
                      <span>
                        <strong>INFO:</strong> Brand recognition increased 18%
                        this week.
                      </span>
                    </div>
                    <div className="feed-item critical">
                      <span>
                        <strong>CRITICAL:</strong> Opposition video trending #1
                        on Twitter.
                      </span>
                    </div>
                    {/* Duplicate for seamless scrolling */}
                    <div className="feed-item info" data-id="wisconsin-opens">
                      <span>
                        <strong>UPDATE:</strong> Wisconsin voter registration up
                        34%.
                      </span>
                    </div>
                    <div className="feed-item warning">
                      <span>
                        <strong>WARNING:</strong> Major news outlet published
                        critical article.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="right-column">
            {/* Phrase Cloud */}
            <div className="card phrase-cloud">
              <div className="phrase-container">
                <div className="keywords-section">
                  <div className="keyword-group">
                    <div
                      style={{
                        color: "#94a3b8",
                        fontWeight: 600,
                        marginBottom: "6px",
                        fontSize: "10px",
                      }}
                    >
                      KEYWORDS
                    </div>
                    <div className="keyword-list">
                      • Economy
                      <br />
                      • Healthcare
                      <br />• Donald Trump
                    </div>
                  </div>
                  <div className="keyword-group">
                    <div
                      style={{
                        color: "#94a3b8",
                        fontWeight: 600,
                        marginBottom: "6px",
                        fontSize: "10px",
                      }}
                    >
                      RELATED
                    </div>
                    <div className="keyword-list">
                      • Inflation
                      <br />
                      • Medicare
                      <br />
                      • GOP Primary
                      <br />
                      • Tax Policy
                      <br />• Border Security
                    </div>
                  </div>
                </div>
                <div className="phrase-3d">
                  <div className="phrase-carousel">
                    <div className="phrase-item">
                      Trump leads GOP primary polling by 42 points nationwide
                    </div>
                    <div className="phrase-item">
                      Healthcare costs surge 23% in critical swing states
                    </div>
                    <div className="phrase-item">
                      Economy shows mixed signals ahead of Fed meeting
                    </div>
                    <div className="phrase-item">
                      Medicare expansion gains bipartisan support
                    </div>
                    <div className="phrase-item">
                      Trump defense fund raises $47M post-indictment
                    </div>
                    <div className="phrase-item">
                      Inflation eases but remains top voter priority
                    </div>
                    <div className="phrase-item">
                      Border security bill passes House committee
                    </div>
                    <div className="phrase-item">
                      Trump rallies Iowa base before caucus deadline
                    </div>
                    <div className="phrase-item">
                      Prescription drug costs hit unprecedented highs
                    </div>
                    <div className="phrase-item">
                      Global market volatility impacts US outlook
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Golden Measure Squares */}
            <div className="metric-boxes-container">
              <div className="card metric-box-square">
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: 700,
                    color: "#ef4444",
                  }}
                >
                  7
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    marginTop: "8px",
                    textAlign: "center",
                  }}
                >
                  Real-Time
                  <br />
                  Alerts
                </div>
              </div>
              <div className="card metric-box-square">
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: 700,
                    color: "#3b82f6",
                  }}
                >
                  $47.2K
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    marginTop: "8px",
                  }}
                >
                  Ad Spend
                </div>
              </div>
              <div className="card metric-box-square">
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: 700,
                    color: "#10b981",
                  }}
                >
                  2,847
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    marginTop: "8px",
                    textAlign: "center",
                  }}
                >
                  Mention
                  <br />
                  Volume
                </div>
              </div>
              <div className="card metric-box-square">
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: 700,
                    color: "#10b981",
                  }}
                >
                  74%
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    marginTop: "8px",
                    textAlign: "center",
                  }}
                >
                  Sentiment
                  <br />
                  Score
                </div>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div
              className="card quick-actions"
              style={{ padding: 0, overflow: "hidden" }}
            >
              <div
                style={{
                  background: "#1f2633",
                  padding: "10px 12px",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Quick Actions
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gridTemplateRows: "repeat(2, 1fr)",
                  height: "calc(100% - 40px)",
                }}
              >
                <div
                  style={{
                    background: "#2a3342",
                    borderRight: "1px solid #1f2633",
                    borderBottom: "1px solid #1f2633",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  Quick Campaign
                </div>
                <div
                  style={{
                    background: "#2a3342",
                    borderRight: "1px solid #1f2633",
                    borderBottom: "1px solid #1f2633",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  Live Monitor
                </div>
                <div
                  style={{
                    background: "#2a3342",
                    borderBottom: "1px solid #1f2633",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  Make Content
                </div>
                <div
                  style={{
                    background: "#2a3342",
                    borderRight: "1px solid #1f2633",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  Trend Ops
                </div>
                <div
                  style={{
                    background: "#2a3342",
                    borderRight: "1px solid #1f2633",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  Social Media
                </div>
                <div
                  style={{
                    background: "#2a3342",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  Alert Center
                </div>
              </div>
            </div>

            {/* Performance Metrics Table */}
            <div className="card performance-metrics">
              <div className="card-title">Performance Metrics</div>
              <div className="metrics-table">
                <div className="metric-cell">
                  <div className="metric-label">Alert Response</div>
                  <div className="metric-value">45s</div>
                  <div className="metric-trend trend-up">▲ 12%</div>
                </div>
                <div className="metric-cell">
                  <div className="metric-label">Campaign ROI</div>
                  <div className="metric-value">3.2x</div>
                  <div className="metric-trend trend-up">▲ 8%</div>
                </div>
                <div className="metric-cell">
                  <div className="metric-label">Threat Score</div>
                  <div className="metric-value">32</div>
                  <div className="metric-trend trend-down">▼ 5%</div>
                </div>
                <div className="metric-cell">
                  <div className="metric-label">Voter Rate</div>
                  <div className="metric-value">67%</div>
                  <div className="metric-trend trend-neutral">— 0%</div>
                </div>
                <div className="metric-cell">
                  <div className="metric-label">Media Reach</div>
                  <div className="metric-value">2.4M</div>
                  <div className="metric-trend trend-up">▲ 23%</div>
                </div>
                <div className="metric-cell">
                  <div className="metric-label">Sentiment</div>
                  <div className="metric-value">+18</div>
                  <div className="metric-trend trend-up">▲ 3%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Social Post Thumbnails - Full Width */}
          <div className="card social-posts">
            <div className="card-title">Social Post Thumbnails</div>
            <div className="social-grid">
              <div className="social-grid-wrapper">
                {/* First set */}
                <div className="social-thumbnail">
                  <div
                    style={{
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      height: "100%",
                    }}
                  ></div>
                  <div className="social-overlay">
                    <div className="social-metrics">
                      <span>❤️ 2.3K</span>
                      <span>🔄 847</span>
                    </div>
                  </div>
                </div>
                <div className="social-thumbnail">
                  <div
                    style={{
                      background:
                        "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                      height: "100%",
                    }}
                  ></div>
                  <div className="social-overlay">
                    <div className="social-metrics">
                      <span>❤️ 5.1K</span>
                      <span>🔄 1.2K</span>
                    </div>
                  </div>
                </div>
                <div className="social-thumbnail">
                  <div
                    style={{
                      background:
                        "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                      height: "100%",
                    }}
                  ></div>
                  <div className="social-overlay">
                    <div className="social-metrics">
                      <span>❤️ 923</span>
                      <span>🔄 145</span>
                    </div>
                  </div>
                </div>
                <div className="social-thumbnail">
                  <div
                    style={{
                      background:
                        "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
                      height: "100%",
                    }}
                  ></div>
                  <div className="social-overlay">
                    <div className="social-metrics">
                      <span>❤️ 7.8K</span>
                      <span>🔄 2.9K</span>
                    </div>
                  </div>
                </div>
                <div className="social-thumbnail">
                  <div
                    style={{
                      background:
                        "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                      height: "100%",
                    }}
                  ></div>
                  <div className="social-overlay">
                    <div className="social-metrics">
                      <span>❤️ 3.4K</span>
                      <span>🔄 562</span>
                    </div>
                  </div>
                </div>
                <div className="social-thumbnail">
                  <div
                    style={{
                      background:
                        "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
                      height: "100%",
                    }}
                  ></div>
                  <div className="social-overlay">
                    <div className="social-metrics">
                      <span>❤️ 8.9K</span>
                      <span>🔄 2.1K</span>
                    </div>
                  </div>
                </div>
                {/* Duplicate set for seamless scrolling */}
                <div className="social-thumbnail">
                  <div
                    style={{
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      height: "100%",
                    }}
                  ></div>
                  <div className="social-overlay">
                    <div className="social-metrics">
                      <span>❤️ 2.3K</span>
                      <span>🔄 847</span>
                    </div>
                  </div>
                </div>
                <div className="social-thumbnail">
                  <div
                    style={{
                      background:
                        "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                      height: "100%",
                    }}
                  ></div>
                  <div className="social-overlay">
                    <div className="social-metrics">
                      <span>❤️ 5.1K</span>
                      <span>🔄 1.2K</span>
                    </div>
                  </div>
                </div>
                <div className="social-thumbnail">
                  <div
                    style={{
                      background:
                        "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                      height: "100%",
                    }}
                  ></div>
                  <div className="social-overlay">
                    <div className="social-metrics">
                      <span>❤️ 923</span>
                      <span>🔄 145</span>
                    </div>
                  </div>
                </div>
                <div className="social-thumbnail">
                  <div
                    style={{
                      background:
                        "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
                      height: "100%",
                    }}
                  ></div>
                  <div className="social-overlay">
                    <div className="social-metrics">
                      <span>❤️ 7.8K</span>
                      <span>🔄 2.9K</span>
                    </div>
                  </div>
                </div>
                <div className="social-thumbnail">
                  <div
                    style={{
                      background:
                        "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                      height: "100%",
                    }}
                  ></div>
                  <div className="social-overlay">
                    <div className="social-metrics">
                      <span>❤️ 3.4K</span>
                      <span>🔄 562</span>
                    </div>
                  </div>
                </div>
                <div className="social-thumbnail">
                  <div
                    style={{
                      background:
                        "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
                      height: "100%",
                    }}
                  ></div>
                  <div className="social-overlay">
                    <div className="social-metrics">
                      <span>❤️ 8.9K</span>
                      <span>🔄 2.1K</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

          {/* Bottom spacer */}
          <div className="dashboard-footer"></div>
        </div>
      </div>
      </div>
    </PageLayout>
  );
}