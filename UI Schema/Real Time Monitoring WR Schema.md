Real-Time Monitoring Page Schema


Updated Real-Time Monitoring Schema (API-Backed)
1. Live Feed (Left Column)
a. Mentions Stream
Data Source: /mentions


Filters:


Source


Sentiment


Region (if tagged or geo-inferred)


Display:


Username + Post Snippet + Source + Timestamp


Engagement Score


CTA: “Add to Alert” or “Generate Response”


b. Trending Topics (Issue Spike Detector)
Data Source: /top-keywords


Sort: Last 24h / 7d


Display:


Keyword + % change


Region (if possible)


CTA: “View mentions” or “Draft ad response”


c. Influencer Tracker
Data Source: /top-influencers


Display:


Handle, follower count, reach score


Sample post


CTA: “Add to Watchlist” or “Amplify Mention”



2. Right Column (Visual Dashboards)
a. Sentiment Breakdown
Data Source: /sentiment-stats


View: Pie chart + trendline


Filters: Source, Topic, Region


Toggle: Positive / Negative / Neutral breakdown


b. Platform Performance
Data Source: /sources


View: Bar or pie chart of where mentions are occurring (e.g. Twitter, Reddit, News)


Insight: “Facebook mentions down 32% — X now dominant platform”



3. Command Input
Same as before, but queries now run against Mentionlytics data


Example Prompts:


“Show negative sentiment in swing districts”


“Which influencers are talking about our opponent today?”


“What’s the most mentioned issue in the last 2 hours?”



4. Dynamic Alert Banner (Optional)
Logic: If a spike in mentions + negative sentiment detected from /mentions + /sentiment-stats


Example:


 🔴 “Negative mentions about crime policy up 234% in last 12h — trending in District 8”

