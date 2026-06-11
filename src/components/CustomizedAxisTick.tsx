export const CustomizedAxisTick = ({ x, y, payload }: any) => {
  return (
    <g transform={`translate(${x},${y})`}>
      <text 
        x={0} 
        y={0} 
        dy={16} 
        textAnchor="end" 
        fill="#1e293b" 
        fontSize={11} 
        fontWeight="bold" 
        transform="rotate(-45)"
      >
        {payload.value}
      </text>
    </g>
  );
};
