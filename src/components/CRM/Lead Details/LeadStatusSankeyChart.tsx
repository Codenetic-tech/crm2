import React, { useMemo } from 'react';
import { ResponsiveContainer, Sankey, Tooltip, Layer, Rectangle } from 'recharts';
import { Lead } from '@/utils/crm';

interface LeadStatusSankeyChartProps {
    leads: Lead[];
}

const LeadStatusSankeyChart: React.FC<LeadStatusSankeyChartProps> = ({ leads }) => {
    const data = useMemo(() => {
        if (!leads || leads.length === 0) {
            return { nodes: [], links: [] };
        }

        const sources = new Set<string>();
        const statuses = new Set<string>();
        const linksMap = new Map<string, number>();

        leads.forEach((lead) => {
            const source = lead.source || 'Unknown Source';
            const status = lead.status ? (lead.status.charAt(0).toUpperCase() + lead.status.slice(1)) : 'Unknown Status';

            sources.add(source);
            statuses.add(status);

            const key = `${source}|${status}`;
            linksMap.set(key, (linksMap.get(key) || 0) + 1);
        });

        const sourceArray = Array.from(sources).sort();
        const statusArray = Array.from(statuses).sort();

        const nodes = [
            ...sourceArray.map((name) => ({ name })),
            ...statusArray.map((name) => ({ name })),
        ];

        const links = [];
        for (const [key, value] of linksMap.entries()) {
            const [sourceName, statusName] = key.split('|');
            const sourceIndex = sourceArray.indexOf(sourceName);
            const statusIndex = statusArray.indexOf(statusName) + sourceArray.length;

            links.push({
                source: sourceIndex,
                target: statusIndex,
                value,
            });
        }

        return { nodes, links };
    }, [leads]);

    if (data.nodes.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500">
                No data available for Sankey diagram
            </div>
        );
    }

    // Custom Node Component
    const renderNode = (props: any) => {
        const { x, y, width, height, index, payload, containerWidth } = props;
        const isOut = x + width + 6 > containerWidth;

        return (
            <Layer key={`node-${index}`}>
                <Rectangle
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill="#8884d8"
                    fillOpacity="1"
                />
                <text
                    textAnchor={isOut ? 'end' : 'start'}
                    x={isOut ? x - 6 : x + width + 6}
                    y={y + height / 2}
                    fontSize="14"
                    fill="#374151"
                    fontWeight="600"
                    dy={4}
                >
                    {payload.name}
                </text>
                <text
                    textAnchor={isOut ? 'end' : 'start'}
                    x={isOut ? x - 6 : x + width + 6}
                    y={y + height / 2 + 16}
                    fontSize="12"
                    fill="#9ca3af"
                    dy={4}
                >
                    {payload.value} leads
                </text>
            </Layer>
        );
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl shadow-blue-100 p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300">
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
                        node={renderNode}
                        nodePadding={50}
                        nodeWidth={16}
                        margin={{
                            left: 20,
                            right: 150,
                            top: 20,
                            bottom: 20,
                        }}
                        link={{ stroke: '#3b82f6', strokeOpacity: 0.3, strokeWidth: 2 }}
                    >
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#09090b',
                                border: 'none',
                                borderRadius: '0.5rem',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                                padding: '0.75rem',
                                color: '#ffffff'
                            }}
                            itemStyle={{
                                color: '#ffffff',
                                fontSize: '0.875rem',
                                fontWeight: '500'
                            }}
                            labelStyle={{
                                color: '#ffffff',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                marginBottom: '0.25rem'
                            }}
                        />
                    </Sankey>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default LeadStatusSankeyChart;