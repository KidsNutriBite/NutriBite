import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MealFrequencyChart = ({ data }) => {
    return (
        <div className="h-80 w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-gray-800 font-bold mb-6 text-lg">Weekly Meal Activity</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis
                        dataKey="_id"
                        tick={{ fontSize: 12, fill: '#9CA3AF', fontWeight: 'bold' }}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                    />
                    <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 12, fill: '#9CA3AF' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        cursor={{ fill: '#F3F4F6', radius: 8 }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Bar
                        dataKey="count"
                        fill="#2b9dee"
                        radius={[6, 6, 6, 6]}
                        barSize={32}
                        animationDuration={1500}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default MealFrequencyChart;
