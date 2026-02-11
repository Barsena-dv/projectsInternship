import React from "react";
import "../assets/table.css";

export const TableComponent = ({ title, columns, data, rules = {} }) => {

    return (
        <div className="page">
            <h1 className="page-title">{title}</h1>

            <div className="table-wrapper">
                <table className="data-table">

                    <thead>
                        <tr>
                            {columns.map(col => (
                                <th key={col.key}>{col.label}</th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {data.map((row, index) => (
                            <tr key={row.id || index}>
                                {columns.map(col => {

                                    let value = row[col.key];

                                    // apply conditional styling
                                    let className = "";
                                    if (rules[col.key]) {
                                        className = rules[col.key](value, row);
                                    }

                                    return (
                                        <td key={col.key} className={className}>
                                            {col.render ? col.render(value, row) : value}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>

                </table>
            </div>
        </div>
    );
};
