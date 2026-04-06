const SAMPLE_DATA = [
    { Region: "North", Revenue: 114000, Units: 300, Profit: 27000 },
    { Region: "South", Revenue: 75000, Units: 180, Profit: 23900 },
    { Region: "East", Revenue: 55000, Units: 280, Profit: 17700 },
    { Region: "West", Revenue: 93000, Units: 115, Profit: 30500 },
];

const MONTHLY_DATA = [
    { Month: "2025-01", Revenue: 155000, Units: 230 },
    { Month: "2025-02", Revenue: 54000, Units: 345 },
    { Month: "2025-03", Revenue: 128000, Units: 300 },
];

const MOCK_DASHBOARDS = [
    {
        id: "1",
        title: "Sales Overview",
        description: "Revenue, units, and profit across regions",
        owner: "Sankalp",
        modified: "2025-03-06",
        tags: ["sales", "revenue"],
        tabs: [
            {
                key: "tab-1",
                label: "Overview",
                layout: [
                    { i: "chart-1", x: 0, y: 0, w: 6, h: 5 },
                    { i: "chart-2", x: 6, y: 0, w: 6, h: 5 },
                    { i: "chart-3", x: 0, y: 5, w: 4, h: 5 },
                    { i: "chart-4", x: 4, y: 5, w: 8, h: 5 },
                ],
                charts: [
                    {
                        id: "chart-1", title: "Revenue by Region", type: "bar",
                        config: { x_axis: "Region", measures: ["Revenue", "Profit"] },
                        data: SAMPLE_DATA,
                    },
                    {
                        id: "chart-2", title: "Monthly Trend", type: "line",
                        config: { x_axis: "Month", measures: ["Revenue", "Units"] },
                        data: MONTHLY_DATA,
                    },
                    {
                        id: "chart-3", title: "Revenue Share", type: "pie",
                        config: { x_axis: "Region", measures: ["Revenue"] },
                        data: SAMPLE_DATA,
                    },
                    {
                        id: "chart-4", title: "Region Details", type: "table",
                        config: { columns: ["Region", "Revenue", "Units", "Profit"] },
                        data: SAMPLE_DATA,
                    },
                ],
            },
            {
                key: "tab-2",
                label: "Details",
                layout: [
                    { i: "chart-5", x: 0, y: 0, w: 12, h: 6 },
                ],
                charts: [
                    {
                        id: "chart-5", title: "Full Breakdown", type: "table",
                        config: { columns: ["Region", "Revenue", "Units", "Profit"] },
                        data: SAMPLE_DATA,
                    },
                ],
            },
        ],
    },
    {
        id: "2",
        title: "Marketing Analytics",
        description: "Campaign performance and conversion funnels",
        owner: "Priya",
        modified: "2025-03-04",
        tags: ["marketing"],
        tabs: [
            {
                key: "tab-1",
                label: "Campaigns",
                layout: [
                    { i: "chart-1", x: 0, y: 0, w: 4, h: 5 },
                    { i: "chart-2", x: 4, y: 0, w: 4, h: 5 },
                    { i: "chart-3", x: 8, y: 0, w: 4, h: 5 },
                ],
                charts: [
                    {
                        id: "chart-1", title: "Spend by Channel", type: "pie",
                        config: { x_axis: "Channel", measures: ["Spend"] },
                        data: [
                            { Channel: "Google", Spend: 45000 },
                            { Channel: "Meta", Spend: 32000 },
                            { Channel: "LinkedIn", Spend: 18000 },
                        ],
                    },
                    {
                        id: "chart-2", title: "Conversions", type: "bar",
                        config: { x_axis: "Channel", measures: ["Conversions"] },
                        data: [
                            { Channel: "Google", Conversions: 1200 },
                            { Channel: "Meta", Conversions: 890 },
                            { Channel: "LinkedIn", Conversions: 340 },
                        ],
                    },
                    {
                        id: "chart-3", title: "CTR Trend", type: "line",
                        config: { x_axis: "Month", measures: ["CTR"] },
                        data: [
                            { Month: "Jan", CTR: 2.4 },
                            { Month: "Feb", CTR: 2.8 },
                            { Month: "Mar", CTR: 3.1 },
                        ],
                    },
                ],
            },
        ],
    },
    {
        id: "3",
        title: "Ops Performance",
        description: "Delivery times, SLA breaches, hub efficiency",
        owner: "Sankalp",
        modified: "2025-03-01",
        tags: ["ops", "logistics"],
        tabs: [
            {
                key: "tab-1",
                label: "SLA",
                layout: [
                    { i: "chart-1", x: 0, y: 0, w: 6, h: 5 },
                    { i: "chart-2", x: 6, y: 0, w: 6, h: 5 },
                ],
                charts: [
                    {
                        id: "chart-1", title: "SLA Breach Rate", type: "line",
                        config: { x_axis: "Week", measures: ["Breach_Pct"] },
                        data: [
                            { Week: "W1", Breach_Pct: 4.2 },
                            { Week: "W2", Breach_Pct: 3.8 },
                            { Week: "W3", Breach_Pct: 5.1 },
                            { Week: "W4", Breach_Pct: 2.9 },
                        ],
                    },
                    {
                        id: "chart-2", title: "Hub Efficiency", type: "bar",
                        config: { x_axis: "Hub", measures: ["Efficiency"] },
                        data: [
                            { Hub: "Hub A", Efficiency: 92 },
                            { Hub: "Hub B", Efficiency: 87 },
                            { Hub: "Hub C", Efficiency: 95 },
                        ],
                    },
                ],
            },
        ],
    },
    {
        id: "4",
        title: "Finance Summary",
        description: "P&L, burn rate, and monthly expenses",
        owner: "Rahul",
        modified: "2025-02-28",
        tags: ["finance"],
        tabs: [
            {
                key: "tab-1",
                label: "P&L",
                layout: [
                    { i: "chart-1", x: 0, y: 0, w: 12, h: 5 },
                ],
                charts: [
                    {
                        id: "chart-1", title: "Monthly P&L", type: "bar",
                        config: { x_axis: "Month", measures: ["Revenue", "Expenses", "Profit"] },
                        data: [
                            { Month: "Jan", Revenue: 500000, Expenses: 420000, Profit: 80000 },
                            { Month: "Feb", Revenue: 480000, Expenses: 390000, Profit: 90000 },
                            { Month: "Mar", Revenue: 550000, Expenses: 410000, Profit: 140000 },
                        ],
                    },
                ],
            },
        ],
    },
    {
        id: "5",
        title: "Product Metrics",
        description: "DAU, retention, feature adoption rates",
        owner: "Meera",
        modified: "2025-02-25",
        tags: ["product"],
        tabs: [
            {
                key: "tab-1",
                label: "Engagement",
                layout: [
                    { i: "chart-1", x: 0, y: 0, w: 6, h: 5 },
                    { i: "chart-2", x: 6, y: 0, w: 6, h: 5 },
                ],
                charts: [
                    {
                        id: "chart-1", title: "DAU Trend", type: "line",
                        config: { x_axis: "Date", measures: ["DAU"] },
                        data: [
                            { Date: "Mar 1", DAU: 12400 },
                            { Date: "Mar 2", DAU: 13100 },
                            { Date: "Mar 3", DAU: 11800 },
                            { Date: "Mar 4", DAU: 14200 },
                            { Date: "Mar 5", DAU: 15000 },
                        ],
                    },
                    {
                        id: "chart-2", title: "Retention Cohorts", type: "table",
                        config: { columns: ["Cohort", "Week_1", "Week_2", "Week_4", "Week_8"] },
                        data: [
                            { Cohort: "Jan", Week_1: "72%", Week_2: "58%", Week_4: "41%", Week_8: "28%" },
                            { Cohort: "Feb", Week_1: "75%", Week_2: "61%", Week_4: "44%", Week_8: "31%" },
                            { Cohort: "Mar", Week_1: "78%", Week_2: "64%", Week_4: "—", Week_8: "—" },
                        ],
                    },
                ],
            },
        ],
    },
];

export default MOCK_DASHBOARDS;