import React from 'react';

type ResultGaugeProps = {
	percent: number;
	label?: string;
	size?: number;
};

export default function ResultGauge({ percent, label = 'Percentile', size = 160 }: ResultGaugeProps) {
	const safe = Math.max(0, Math.min(100, Math.round(percent)));
	const circleStyle: React.CSSProperties = {
		width: size,
		height: size,
		borderRadius: '50%',
		background: `conic-gradient(var(--accent, #22d3ee) ${safe}%, #262b36 ${safe}% 100%)`,
		display: 'grid',
		placeItems: 'center',
	};

	const innerStyle: React.CSSProperties = {
		width: size - 40,
		height: size - 40,
		borderRadius: '50%',
		background: 'var(--panel)',
		border: '1px solid var(--border)',
		display: 'grid',
		placeItems: 'center',
		color: 'var(--text)',
	};

	return (
		<div className="gauge">
			<div style={circleStyle}>
				<div style={innerStyle}>
					<div style={{ textAlign: 'center' }}>
						<div className="gauge-value">{safe}%</div>
						<div className="gauge-label">{label}</div>
					</div>
				</div>
			</div>
		</div>
	);
}


