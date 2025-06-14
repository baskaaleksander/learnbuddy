import React from 'react';
import {SummaryData} from "@/lib/definitions";

function SummaryCard({summaryData, className}: { summaryData: SummaryData, className?: string }) {
	return (
		<div>
			{summaryData.bulletPointsCount} {summaryData.chaptersCount} {summaryData.title}
		</div>
	);
}

export default SummaryCard;