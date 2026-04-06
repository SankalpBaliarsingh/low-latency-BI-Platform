const KEYS = {
    Queries: "bi_saved_queries",
    DAGs: "bi_dags",
};

const Generate_ID = () => crypto.randomUUID();

const Read = (Key) => {
    try {
        const Raw = localStorage.getItem(Key);
        return Raw ? JSON.parse(Raw) : [];
    } catch {
        return [];
    }
};

const Write = (Key, Data) => {
    localStorage.setItem(Key, JSON.stringify(Data));
};

// ──────────────────────────────────────
//  Saved Queries
// ──────────────────────────────────────

export const Get_Saved_Queries = () => Read(KEYS.Queries);

export const Get_Saved_Query = (ID) =>
    Read(KEYS.Queries).find((q) => q.id === ID) || null;

export const Save_Query = (Query) => {
    const All = Read(KEYS.Queries);
    const Now = new Date().toISOString();

    if (Query.id) {
        // Update
        const Index = All.findIndex((q) => q.id === Query.id);
        if (Index === -1) return null;
        All[Index] = { ...All[Index], ...Query, updated_at: Now };
        Write(KEYS.Queries, All);
        return All[Index];
    } else {
        // Create
        const New_Query = {
            ...Query,
            id: Generate_ID(),
            created_at: Now,
            updated_at: Now,
        };
        All.push(New_Query);
        Write(KEYS.Queries, All);
        return New_Query;
    }
};

export const Delete_Query = (ID) => {
    const All = Read(KEYS.Queries).filter((q) => q.id !== ID);
    Write(KEYS.Queries, All);
};

export const Get_Queries_For_DAG = (DAG_ID) => Read(KEYS.Queries).filter((q) => q.dag_id === DAG_ID);

export const Get_Unassigned_Queries = () => Read(KEYS.Queries).filter((q) => !q.dag_id);

export const Assign_Query_To_DAG = (Query_ID, DAG_ID) => {
    const All = Read(KEYS.Queries);
    const Index = All.findIndex((q) => q.id === Query_ID);
    if (Index === -1) return null;
    All[Index].dag_id = DAG_ID;
    All[Index].updated_at = new Date().toISOString();
    Write(KEYS.Queries, All);
    return All[Index];
};

export const Unassign_Query_From_DAG = (Query_ID) => {
    return Assign_Query_To_DAG(Query_ID, null);
};

// ──────────────────────────────────────
//  DAGs
// ──────────────────────────────────────

export const Get_DAGs = () => {
    const DAGs = Read(KEYS.DAGs);
    const Queries = Read(KEYS.Queries);

    return DAGs.map((d) => ({
        ...d,
        query_count: Queries.filter((q) => q.dag_id === d.id).length,
    }));
};

export const Get_DAG = (ID) =>
    Read(KEYS.DAGs).find((d) => d.id === ID) || null;

export const Save_DAG = (DAG) => {
    const All = Read(KEYS.DAGs);
    const Now = new Date().toISOString();

    if (DAG.id) {
        // Update
        const Index = All.findIndex((d) => d.id === DAG.id);
        if (Index === -1) return null;
        All[Index] = { ...All[Index], ...DAG, updated_at: Now };
        Write(KEYS.DAGs, All);
        return All[Index];
    } else {
        // Create
        const New_DAG = {
            ...DAG,
            id: Generate_ID(),
            edges: [],
            created_at: Now,
            updated_at: Now,
        };
        All.push(New_DAG);
        Write(KEYS.DAGs, All);
        return New_DAG;
    }
};

export const Delete_DAG = (ID) => {
    // Unassign all queries belonging to this DAG
    const Queries = Read(KEYS.Queries).map((q) =>
        q.dag_id === ID ? { ...q, dag_id: null, position_x: null, position_y: null } : q
    );
    Write(KEYS.Queries, Queries);

    const All = Read(KEYS.DAGs).filter((d) => d.id !== ID);
    Write(KEYS.DAGs, All);
};

// ──────────────────────────────────────
//  Canvas (edges + node positions)
// ──────────────────────────────────────

export const Save_Canvas = (DAG_ID, { Edges, Node_Positions }) => {
    // Save edges on the DAG
    const DAGs = Read(KEYS.DAGs);
    const DAG_Index = DAGs.findIndex((d) => d.id === DAG_ID);
    if (DAG_Index === -1) return;
    DAGs[DAG_Index].edges = Edges;
    DAGs[DAG_Index].updated_at = new Date().toISOString();
    Write(KEYS.DAGs, DAGs);

    // Save positions on each query
    const Queries = Read(KEYS.Queries);
    Node_Positions.forEach(({ query_id, x, y }) => {
        const Index = Queries.findIndex((q) => q.id === query_id);
        if (Index !== -1) {
            Queries[Index].position_x = x;
            Queries[Index].position_y = y;
        }
    });
    Write(KEYS.Queries, Queries);
};

export const Get_Canvas = (DAG_ID) => {
    const DAG = Get_DAG(DAG_ID);
    const Queries = Get_Queries_For_DAG(DAG_ID);

    return {
        Edges: DAG?.edges || [],
        Nodes: Queries.map((q) => ({
            id: q.id,
            name: q.name,
            target_table: q.target_table,
            mode: q.mode,
            position_x: q.position_x ?? 0,
            position_y: q.position_y ?? 0,
        })),
    };
};