const ResultContainerPlugin = ({ results = [] }) => {
	if (results.length === 0) {
		return null;
	}

	return (
		<div className="result-container">
			<h3 className="result-title">Scan Results:</h3>
			<ul className="result-list">
				{results.map((result, index) => (
					<li
						key={`result-${result.decodedText}-${index}`}
						className="result-item">
						<div className="result-text">
							<strong>Result {index + 1}:</strong> {result.decodedText}
						</div>
						{result.result && (
							<div className="result-details">
								<small>
									Format: {result.result.format?.formatName || "Unknown"} |
									Timestamp: {new Date().toLocaleTimeString()}
								</small>
							</div>
						)}
					</li>
				))}
			</ul>
		</div>
	);
};

export default ResultContainerPlugin;
