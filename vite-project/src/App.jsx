import { createBrowserRouter, RouterProvider, Outlet, Link, useLocation } from "react-router-dom";
import { Layout, Menu } from "antd";
import { 
        DashboardOutlined, 
        BarChartOutlined, 
        ConsoleSqlOutlined, 
        ApartmentOutlined, 
        SaveOutlined,
        DatabaseOutlined
    } from "@ant-design/icons";

import Dashboard_List from "./Pages/Dashboard_List";
import DashboardView from "./Pages/DashboardView";
import QueryEditor from "./Pages/QueryEditor";
import ChartCreator from "./Pages/ChartCreator";
import DAG_List from "./Pages/DAG_List";
import DAG_Detail from "./Pages/DAG_Detail";
import Saved_Queries from "./Pages/Saved_Queries";
import Saved_Query from "./Pages/Saved_Query";
import Telemetry from "./Pages/Telemetry/Telemetry";

const { Header, Content } = Layout;

// Placeholder pages — we'll replace these
const ChartList = () => <div>Chart List</div>;
const Styles = {
    Layout: { minHeight: "100vh" },
    Header: { display: "flex", alignItems: "center", padding: "0 24px", background: "#001529" },
    Title: { color: "#fff", fontSize: 18, fontWeight: 700, marginRight: 40 },
    Menu: { flex: 1, minWidth: 0 },
    Content: { padding: 24 },
}

const Get_Selected_Key = (pathname) => {
    if (pathname.startsWith("/dag")) return "/dags";
    if (pathname.startsWith("/dashboard")) return "/dashboards";
    if (pathname.startsWith("/charts")) return "/charts";
    return pathname;
};

function AppLayout() {
    const Current_Location = useLocation();
    const Nav_Items = [
        { 
            key: "/dashboards", 
            icon: <DashboardOutlined />, 
            label: <Link to="/dashboards">Dashboards</Link> 
        },
        { 
            key: "/charts", 
            icon: <BarChartOutlined />, 
            label: <Link to="/charts">Charts</Link> 
        },
        { 
            key: "/query-editor", 
            icon: <ConsoleSqlOutlined />, 
            label: <Link to="/query-editor">Query Editor</Link> 
        },
        { 
            key: "/dags", 
            icon: <ApartmentOutlined />, 
            label: <Link to="/dags">DAGs</Link> 
        },
        {
            key: "/saved-queries", 
            icon: <SaveOutlined />, 
            label: <Link to="/saved-queries">Saved Queries</Link> 
        },
        { 
            key: "/telemetry", 
            icon: <DatabaseOutlined />, 
            label: <Link to="/telemetry">Telemetry</Link> 
        },
    ];

    return (
        <Layout style={Styles.Layout}>
            <Header style={Styles.Header}>
                <div style={Styles.Title}>BI Platform</div>
                <Menu
                    theme="dark"
                    mode="horizontal"
                    selectedKeys={[Get_Selected_Key(Current_Location.pathname)]}
                    items={Nav_Items}
                    style={Styles.Menu}
                />
            </Header>
            <Content style={Styles.Content}>
                <Outlet />
            </Content>
        </Layout>
    );
}

const Browser_Router = createBrowserRouter([
    {
        path: "/",
        element: <AppLayout />,
        children: [
            { index: true, element: <Dashboard_List /> },
            
            { path: "dashboards", element: <Dashboard_List /> },
            { path: "dashboard/:id", element: <DashboardView /> },
            { path: "charts", element: <ChartList /> },
            { path: "charts/new", element: <ChartCreator /> },
            { path: "query-editor", element: <QueryEditor /> },

            { path: "telemetry", element: <Telemetry /> },
            
            // Scheduler routes
            { path: "dags", element: <DAG_List /> },
            { path: "dag/:id", element: <DAG_Detail /> },
            { path: "dag/new", element: <DAG_Detail /> },

            { path: "saved-queries", element: <Saved_Queries /> },
            { path: "saved-query/:id", element: <Saved_Query /> },
            { path: "saved-query/new", element: <Saved_Query /> },
        ],
    },
]);

function App() {
    return <RouterProvider router={Browser_Router} />;
}

export default App;

/*
    Backend endpoints needed for Saved Queries:
        GET /api/saved-queries → returns array of queries (joined with DAG name)
        GET /api/saved-query/:id → single query
        POST /api/saved-query → create, returns { id }
        PUT /api/saved-query/:id → update
        DELETE /api/saved-query/:id → delete
        GET /api/dags → for the DAG dropdown


    DAG-related endpoints:
        GET /api/dags — list
        POST /api/dags — create (name, description, cron, timezone)
        GET /api/dag/:id — DAG config + its queries + edges
        PUT /api/dag/:id — update config
        PUT /api/dag/:id/canvas — save { edges, node_positions: [{query_id, x, y}] }
        DELETE /api/dag/:id — delete DAG (unassigns queries, doesn't delete them)


    Endpoints the canvas will call:
        GET /api/dag/:id/queries → nodes
        GET /api/dag/:id/edges → edges (or bundled in the DAG fetch)
        PUT /api/dag/:id/canvas → save
        PUT /api/saved-query/:id → assign/unassign dag_id


*/