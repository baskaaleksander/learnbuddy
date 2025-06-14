'use client';
import React, {useEffect, useState} from 'react'
import {fetchGraphQL} from "@/utils/gql-axios";
import LoadingScreen from "@/components/loading-screen";
import ErrorComponent from "@/components/error-component";
import {PaginationProps, SummaryData} from "@/lib/definitions";
import SummaryCard from "@/components/summary-card";

function SummariesPage() {
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [summaries, setSummaries] = useState<PaginationProps<SummaryData> | null>(null);
	const [page, setPage] = useState<number>(1);
	const [pageSize, setPageSize] = useState<number>(10);
	const [sortBy, setSortBy] = useState<string>('newest');
	const [searchQuery, setSearchQuery] = useState<string>('');
	const [totalPages, setTotalPages] = useState<number>(1);

	useEffect(() => {
		const fetchSummaries = async () => {
			try {
				setLoading(true);
				setError(null);

				const summariesResponse = await fetchGraphQL(`
					query GetSummariesByUser {
						getSummariesByUser(page: ${page}, pageSize: ${pageSize}) {
							totalItems
							totalPages
							currentPage
							pageSize
							hasNextPage
							hasPreviousPage
							data {
								id
								createdAt
								title
            					chaptersCount
            					bulletPointsCount
								material {
									id
									title
								}
							}
						}
					}

                `);

				if (summariesResponse.getSummariesByUser.data) {
					setSummaries(summariesResponse.getSummariesByUser);
					setTotalPages(summariesResponse.getSummariesByUser.totalPages);
				} else {
					setError("Summaries not found");
				}
			} catch (error) {
				console.error("Error fetching summaries:", error);
				setError("Failed to fetch summaries. Please try again later.");
			} finally {
				setLoading(false);
			}
		};

		fetchSummaries();
	}, [page, pageSize]);

	if (loading) {
		return <LoadingScreen/>;
	}

	if (error) {
		return <ErrorComponent message={error}/>;
	}

	return (
		<div>
			{summaries ? (
					<div>
						{summaries.data.map((summary) => (
							<SummaryCard
								key={summary.id}
								summaryData={summary}
								className="mb-4"
							/>))}
					</div>) :
				<p>test</p>}
		</div>
	)
}

export default SummariesPage