import React, { useMemo } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Lead } from '@/utils/crm';

interface CampaignLeadSourceProps {
  leads: Lead[];
}

interface CampaignData {
  campaign: string;
  totalLeads: number;
  sources: {
    [source: string]: number;
  };
}

const sourceColors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

// Custom bar shape with rounded corners
const getPath = (x: number, y: number, width: number, height: number) => {
  const radius = 6;
  return `M${x},${y + height}
          L${x},${y + radius}
          Q${x},${y} ${x + radius},${y}
          L${x + width - radius},${y}
          Q${x + width},${y} ${x + width},${y + radius}
          L${x + width},${y + height}
          Z`;
};

const CustomBar = (props: any) => {
  const { fill, x, y, width, height } = props;

  return (
    <g>
      <path 
        d={getPath(Number(x), Number(y), Number(width), Number(height))} 
        fill={fill}
        className="transition-all duration-300 hover:opacity-80"
      />
    </g>
  );
};

const CampaignLeadSourceChart: React.FC<CampaignLeadSourceProps> = ({ leads }) => {
  // Calculate campaign-wise lead source distribution
  const chartData = useMemo(() => {
    // Group leads by campaign
    const campaignMap: { [key: string]: CampaignData } = {};
    
    leads.forEach(lead => {
      if (!lead) return;
      
      const campaign = lead.campaign || 'Uncategorized';
      const source = lead.source || 'Unknown';
      
      if (!campaignMap[campaign]) {
        campaignMap[campaign] = {
          campaign,
          totalLeads: 0,
          sources: {}
        };
      }
      
      campaignMap[campaign].totalLeads++;
      campaignMap[campaign].sources[source] = (campaignMap[campaign].sources[source] || 0) + 1;
    });

    // Get all unique sources across all campaigns
    const allSources = new Set<string>();
    Object.values(campaignMap).forEach(campaignData => {
      Object.keys(campaignData.sources).forEach(source => {
        allSources.add(source);
      });
    });

    const sourcesArray = Array.from(allSources);

    // Convert to chart data format
    const data = Object.values(campaignMap)
      .sort((a, b) => b.totalLeads - a.totalLeads) // Sort by total leads descending
      .slice(0, 10) // Limit to top 10 campaigns for better visibility
      .map(campaignData => {
        const dataPoint: any = {
          campaign: campaignData.campaign,
          totalLeads: campaignData.totalLeads,
          'Uncategorized': 0 // Initialize all sources
        };

        // Add counts for each source
        sourcesArray.forEach(source => {
          dataPoint[source] = campaignData.sources[source] || 0;
        });

        return dataPoint;
      });

    return {
      data,
      sources: sourcesArray
    };
  }, [leads]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0);
      
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-2xl min-w-[200px]">
          <p className="font-semibold text-gray-900 mb-3 border-b pb-2">{label}</p>
          <div className="space-y-2">
            {payload
              .filter((entry: any) => entry.value > 0)
              .sort((a: any, b: any) => b.value - a.value)
              .map((entry: any, index: number) => (
                <div key={index} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {entry.dataKey}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-gray-900">
                      {entry.value}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">
                      ({Math.round((entry.value / total) * 100)}%)
                    </span>
                  </div>
                </div>
              ))
            }
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t">
            <span className="text-sm font-semibold text-gray-900">Total</span>
            <span className="text-sm font-bold text-blue-600">{total}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom legend
  const renderLegend = (props: any) => {
    const { payload } = props;
    
    return (
      <div className="flex flex-wrap gap-2 justify-center mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={`legend-${index}`} className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-lg">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs font-medium text-gray-700">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  if (chartData.data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl shadow-blue-100 p-8 border border-gray-100 text-center">
        <div className="text-gray-400 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">No Campaign Data</h3>
        <p className="text-gray-600 text-sm">No campaign data available to display</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-blue-100 p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Campaign Lead Sources
          </h3>
          <p className="text-sm text-gray-500">
            Lead source distribution across all campaigns
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData.data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 80,
          }}
          className="cursor-pointer"
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#f3f4f6" 
            vertical={false}
          />
          
          <XAxis
            dataKey="campaign"
            axisLine={false}
            tickLine={false}
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }}
            interval={0}
          />
          
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }}
            tickFormatter={(value) => value > 1000 ? `${(value / 1000).toFixed(0)}K` : value.toString()}
          />
          
          <Tooltip content={<CustomTooltip />} />
          <Legend content={renderLegend} />
          
          {chartData.sources.slice(0, 6).map((source, index) => (
            <Bar
              key={source}
              dataKey={source}
              name={source}
              stackId="a"
              shape={<CustomBar />}
              radius={index === chartData.sources.slice(0, 6).length - 1 ? [4, 4, 0, 0] : undefined}
            >
              {chartData.data.map((_entry, barIndex) => (
                <Cell 
                  key={`cell-${barIndex}`} 
                  fill={sourceColors[index % sourceColors.length]}
                  className="transition-all duration-300 hover:brightness-110"
                />
              ))}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {chartData.data.length}
          </div>
          <div className="text-sm text-gray-500">Campaigns</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {chartData.sources.length}
          </div>
          <div className="text-sm text-gray-500">Unique Sources</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {leads.length}
          </div>
          <div className="text-sm text-gray-500">Total Leads</div>
        </div>
      </div>

      {/* Campaign List */}
      <div className="mt-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Campaign Summary</h4>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {chartData.data.map((campaign, index) => (
            <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <span className="text-sm font-medium text-gray-700 truncate">
                {campaign.campaign}
              </span>
              <span className="text-sm font-semibold text-blue-600">
                {campaign.totalLeads} leads
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CampaignLeadSourceChart;