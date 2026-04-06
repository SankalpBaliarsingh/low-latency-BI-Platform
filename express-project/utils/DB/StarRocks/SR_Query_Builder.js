const knex = require("knex")({ client: "mysql2", connection: {} });

const Build_Chart_Query = (dataset, chart_config) => {
    const { table_name, database } = dataset;
    const { dimensions = [], measures = [], filters = [], order_by, limit } = chart_config;

    const full_table = `${database}.${table_name}`;
    let query = knex(full_table);

    // SELECT dimensions
    dimensions.forEach((dim) => {
        query = query.select(dim);
    });

    // SELECT measures with aggregation
    measures.forEach((m) => {
        const agg = m.aggregation.toLowerCase();
        switch (agg) {
            case "sum":
                query = query.sum(`${m.column} as ${m.column}`);
                break;
            case "avg":
                query = query.avg(`${m.column} as ${m.column}`);
                break;
            case "count":
                query = query.count(`${m.column} as ${m.column}`);
                break;
            case "min":
                query = query.min(`${m.column} as ${m.column}`);
                break;
            case "max":
                query = query.max(`${m.column} as ${m.column}`);
                break;
            default:
                query = query.sum(`${m.column} as ${m.column}`);
        }
    });

    // WHERE filters
    filters.forEach((f) => {
        switch (f.operator) {
            case "=":
                query = query.where(f.column, "=", f.value);
                break;
            case "!=":
                query = query.where(f.column, "!=", f.value);
                break;
            case ">":
                query = query.where(f.column, ">", f.value);
                break;
            case ">=":
                query = query.where(f.column, ">=", f.value);
                break;
            case "<":
                query = query.where(f.column, "<", f.value);
                break;
            case "<=":
                query = query.where(f.column, "<=", f.value);
                break;
            case "in":
                query = query.whereIn(f.column, f.value);
                break;
            case "not_in":
                query = query.whereNotIn(f.column, f.value);
                break;
            case "like":
                query = query.where(f.column, "like", f.value);
                break;
            default:
                query = query.where(f.column, "=", f.value);
        }
    });

    // GROUP BY dimensions (if measures exist)
    if (measures.length > 0 && dimensions.length > 0) {
        query = query.groupBy(dimensions);
    }

    // ORDER BY
    if (order_by && order_by.column) {
        query = query.orderBy(order_by.column, order_by.direction || "asc");
    }

    // LIMIT
    if (limit) {
        query = query.limit(limit);
    }

    return query.toString();
};

module.exports = Build_Chart_Query;