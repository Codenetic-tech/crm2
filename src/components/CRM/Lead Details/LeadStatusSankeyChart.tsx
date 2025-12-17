import React, { useMemo } from 'react';
import { ResponsiveContainer, Sankey, Tooltip, Layer, Rectangle } from 'recharts';
import { Lead } from '@/utils/crm';

interface LeadStatusSankeyChartProps {
    leads: Lead[];
}

function MyCustomSankeyNode({ x, y, width, height, index, payload, containerWidth }: any) {
    const isOut = listIsOut(x, width, containerWidth);

    return (
        <Layer key={`CustomNode${index}`}>
            <Rectangle x={x} y={y} width={width} height={height} fill="#2f00ffff" fillOpacity="1" />
            <text
                textAnchor={isOut ? 'end' : 'start'}
                x={isOut ? x - 6 : x + width + 6}
                y={y + height / 2}
                fontSize="14"
                stroke="#333"
            >
                {`${payload.name} (${payload.value})`}
            </text>
        </Layer>
    );
}

function listIsOut(x: number, width: number, containerWidth: number) {
    if (containerWidth == null) return false;
    return x + width + 6 > containerWidth;
}

const LeadStatusSankeyChart: React.FC<LeadStatusSankeyChartProps> = ({ leads }) => {
    const data = useMemo(() => {
        if (!leads || leads.length === 0) {
            return { nodes: [], links: [] };
        }

        const sourcesMap = new Map<string, number>();
        const sourceStatusMap = new Map<string, number>();
        const uniqueStatuses = new Set<string>();

        leads.forEach((lead) => {
            const source = lead.source || 'Unknown Source';
            const status = lead.status ? (lead.status.charAt(0).toUpperCase() + lead.status.slice(1)) : 'Unknown Status';

            // Count for Total -> Source
            sourcesMap.set(source, (sourcesMap.get(source) || 0) + 1);

            // Count for Source -> Status
            const key = `${source}|${status}`;
            sourceStatusMap.set(key, (sourceStatusMap.get(key) || 0) + 1);

            uniqueStatuses.add(status);
        });

        const sortedSources = Array.from(sourcesMap.keys()).sort();
        const sortedStatuses = Array.from(uniqueStatuses).sort();

        // Construct Nodes: [Total Leads, ...Sources, ...Statuses]
        const nodes = [
            { name: "Total Leads" },
            ...sortedSources.map((name) => ({ name })),
            ...sortedStatuses.map((name) => ({ name })),
        ];

        const links = [];

        // level 0: Total Leads -> Sources
        const totalLeadsIndex = 0;
        sortedSources.forEach((source, idx) => {
            const sourceIndex = idx + 1; // 1-based index for sources
            links.push({
                source: totalLeadsIndex,
                target: sourceIndex,
                value: sourcesMap.get(source) || 0,
            });
        });

        // level 1: Sources -> Statuses
        // We iterate map to create links
        sourceStatusMap.forEach((value, key) => {
            const [sourceName, statusName] = key.split('|');
            const sourceIndex = sortedSources.indexOf(sourceName) + 1;
            const statusIndex = sortedStatuses.indexOf(statusName) + 1 + sortedSources.length;

            links.push({
                source: sourceIndex,
                target: statusIndex,
                value: value,
            });
        });

        return { nodes, links };
    }, [leads]);

    if (data.nodes.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500">
                No data available for Sankey diagram
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-xl shadow-blue-50 p-6 border border-gray-100 hover:shadow-2xl hover:shadow-blue-100 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Lead Flow Distribution</h3>
                    <p className="text-sm text-gray-500">Flow of leads from Source to Status</p>
                </div>
            </div>

            <div className="h-[500px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <Sankey
                        data={data}
                        node={MyCustomSankeyNode}
                        nodePadding={30}
                        nodeWidth={10}
                        margin={{
                            left: 20,
                            right: 150,
                            top: 20,
                            bottom: 20,
                        }}
                        link={{ stroke: '#272af7ff' }}
                    >
                        <Tooltip />
                    </Sankey>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default LeadStatusSankeyChart;