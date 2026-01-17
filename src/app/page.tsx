'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Autoplay from 'embla-carousel-autoplay'
import useEmblaCarousel from 'embla-carousel-react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react'

type Collection = {
    name: string
    symbol: string
    contract_address: string
    background_image: string
    image: string
    floor_price: number | null
    floor_currency: string | null
    floor_price_usd: number | null
    cards_with_listings: number
    min_price: string | null
}

type Project = {
    id?: string
    name: string
    collections: Collection[]
}

type LandingData = {
    projects: Project[]
}

type VolumeData = {
    contract_address: string
    volume: {
        '1h': {
            sales: number
            volume_usd: number
        }
        '24h': {
            sales: number
            volume_usd: number
        }
        '7d': {
            sales: number
            volume_usd: number
        }
        '30d': {
            sales: number
            volume_usd: number
        }
    }
}

const CarouselSkeleton = () => (
    <div className="relative h-120 overflow-hidden">
        <div className="absolute inset-0 bg-gray-800 animate-pulse"></div>

        <div className="absolute bottom-0 left-0 md:left-10 p-4 md:p-8 z-10">
            <div className="h-8 md:h-10 w-64 bg-gray-700 rounded mb-2 animate-pulse"></div>
            <div className="h-4 w-32 bg-gray-700 rounded mb-4 animate-pulse"></div>

            <div className="flex gap-4 md:gap-8 rounded-lg p-3 bg-black/20 border border-lines backdrop-blur-md">
                <div>
                    <div className="h-3 w-16 bg-gray-700 rounded mb-1 animate-pulse"></div>
                    <div className="h-5 w-24 bg-gray-700 rounded animate-pulse"></div>
                </div>
                <div>
                    <div className="h-3 w-16 bg-gray-700 rounded mb-1 animate-pulse"></div>
                    <div className="h-5 w-16 bg-gray-700 rounded animate-pulse"></div>
                </div>
                <div>
                    <div className="h-3 w-16 bg-gray-700 rounded mb-1 animate-pulse"></div>
                    <div className="h-5 w-20 bg-gray-700 rounded animate-pulse"></div>
                </div>
            </div>
        </div>

        <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 z-10">
            <div className="w-16 h-16 md:w-24 md:h-24 bg-gray-700 rounded-lg animate-pulse"></div>
        </div>
    </div>
)

const ProjectCardSkeleton = () => (
    <div className="bg-background border border-lines rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-700 animate-pulse"></div>
                <div>
                    <div className="h-6 w-32 bg-gray-700 rounded mb-2 animate-pulse"></div>
                    <div className="h-4 w-24 bg-gray-700 rounded animate-pulse"></div>
                </div>
            </div>
        </div>
        <div className="space-y-2">
            <div className="h-16 bg-gray-700 rounded animate-pulse"></div>
            <div className="h-16 bg-gray-700 rounded animate-pulse"></div>
        </div>
    </div>
)

const Page = () => {
    const router = useRouter()
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 4000 })])
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [data, setData] = useState<LandingData>({ projects: [] })
    const [isLoading, setIsLoading] = useState(true)
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
    const [volumeData, setVolumeData] = useState<Record<string, VolumeData>>({})

    useEffect(() => {
        const fetchLanding = async () => {
            try {
                const response = await fetch("https://immutable-marketplace.onrender.com/api/projects");
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const fetchData = await response.json();
                setData(fetchData);

                // Fetch volume data for all collections
                const allCollections = fetchData.projects
                    .flatMap((project: Project) => project.collections)
                    .filter((c: Collection) => c.cards_with_listings > 0);

                const volumePromises = allCollections.map(async (collection: Collection) => {
                    try {
                        const volumeResponse = await fetch(
                            `https://immutable-marketplace.onrender.com/api/collections/${collection.contract_address}/volume`
                        );
                        if (volumeResponse.ok) {
                            const volumeInfo = await volumeResponse.json();
                            return { [collection.contract_address]: volumeInfo };
                        }
                    } catch (err) {
                        console.error(`Failed to fetch volume for ${collection.contract_address}:`, err);
                    }
                    return null;
                });

                const volumeResults = await Promise.all(volumePromises);
                const volumeMap = volumeResults.reduce((acc, item) => {
                    if (item) return { ...acc, ...item };
                    return acc;
                }, {});

                setVolumeData(volumeMap);
            } catch (err) {
                console.error("Failed to fetch projects:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLanding();
    }, []);

    // Get all collections with listings for carousel
    const allCollections = data.projects
        .flatMap(project => project.collections)
        .filter(collection => collection.cards_with_listings > 0)

    const scrollPrev = useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev()
    }, [emblaApi])

    const scrollNext = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext()
    }, [emblaApi])

    const onSelect = useCallback(() => {
        if (!emblaApi) return
        setSelectedIndex(emblaApi.selectedScrollSnap())
    }, [emblaApi])

    useEffect(() => {
        if (!emblaApi) return
        onSelect()
        emblaApi.on('select', onSelect)
        emblaApi.on('reInit', onSelect)
    }, [emblaApi, onSelect])

    const scrollTo = useCallback((index: number) => {
        if (emblaApi) emblaApi.scrollTo(index)
    }, [emblaApi])

    const toggleProject = (projectName: string) => {
        setExpandedProjects(prev => {
            const newSet = new Set(prev)
            if (newSet.has(projectName)) {
                newSet.delete(projectName)
            } else {
                newSet.add(projectName)
            }
            return newSet
        })
    }

    // Calculate project stats
    const getProjectStats = (project: Project) => {
        const collectionsWithListings = project.collections.filter(c => c.cards_with_listings > 0)
        const totalListings = collectionsWithListings.reduce((sum, c) => sum + c.cards_with_listings, 0)

        // Find lowest floor price across all collections
        const lowestFloor = collectionsWithListings
            .filter(c => c.floor_price !== null)
            .reduce<{ price: number; currency: string } | null>((lowest, c) => {
                if (!lowest || (c.floor_price !== null && c.floor_price < lowest.price)) {
                    return { price: c.floor_price!, currency: c.floor_currency! }
                }
                return lowest
            }, null)

        // Calculate total 24h volume for project
        const total24hVolume = collectionsWithListings.reduce((sum, c) => {
            const volume = volumeData[c.contract_address]?.volume?.['24h']?.volume_usd || 0
            return sum + volume
        }, 0)

        // Calculate total 7d volume for project
        const total7dVolume = collectionsWithListings.reduce((sum, c) => {
            const volume = volumeData[c.contract_address]?.volume?.['7d']?.volume_usd || 0
            return sum + volume
        }, 0)

        return {
            totalListings,
            collectionsCount: collectionsWithListings.length,
            lowestFloor,
            total24hVolume,
            total7dVolume
        }
    }

    // Format currency
    const formatCurrency = (value: number) => {
        if (value >= 1000000) {
            return `$${(value / 1000000).toFixed(2)}M`
        } else if (value >= 1000) {
            return `$${(value / 1000).toFixed(2)}K`
        }
        return `$${value.toFixed(2)}`
    }

    // Calculate percentage change (using 24h vs 7d as an example)
    const calculatePercentageChange = (current: number, previous: number) => {
        if (previous === 0) return 0
        return ((current - previous) / previous) * 100
    }

    // Get top collections by 7-day volume
    const getTopCollectionsByVolume = () => {
        const collectionsWithVolume = allCollections
            .map(collection => ({
                ...collection,
                volumeData: volumeData[collection.contract_address]
            }))
            .filter(c => c.volumeData?.volume?.['7d']?.volume_usd)
            .sort((a, b) =>
                (b.volumeData?.volume?.['7d']?.volume_usd || 0) -
                (a.volumeData?.volume?.['7d']?.volume_usd || 0)
            )
            .slice(0, 10) // Top 10

        return collectionsWithVolume
    }

    return (
        <div className="pt-20 bg-background">
            {/* Featured Collection Carousel */}
            <div className="relative group">
                {isLoading ? (
                    <div className="overflow-hidden rounded-none md:rounded-2xl md:mx-6 mb-2 md:border border-lines">
                        <CarouselSkeleton />
                    </div>
                ) : (
                    <>
                        <div className="overflow-hidden rounded-none md:rounded-2xl md:mx-6 mb-2" ref={emblaRef}>
                            <div className="flex">
                                {allCollections.map((collection, index) => {
                                    const collectionVolume = volumeData[collection.contract_address]

                                    return (
                                        <div key={index} className="flex-[0_0_100%] min-w-0 md:border border-lines" onClick={() => {
                                            router.push(`/collection/${collection?.contract_address}`)
                                        }}>
                                            <div className="relative h-120 overflow-hidden cursor-pointer">
                                                {/* Background Image */}
                                                <div className="absolute inset-0">
                                                    <img
                                                        src={collection.background_image}
                                                        alt={collection.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40"></div>
                                                </div>

                                                {/* Content */}
                                                <div className="absolute bottom-0 left-0 md:left-10 p-4 md:p-8 z-10">
                                                    <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">
                                                        {collection.name}
                                                    </h2>
                                                    <p className="text-xs md:text-sm text-gray-300 mb-4">
                                                        Symbol: {collection.symbol}
                                                    </p>

                                                    <div className="flex flex-wrap gap-4 md:gap-6 rounded-lg p-3 bg-black/20 border border-lines backdrop-blur-md">
                                                        <div>
                                                            <div className="text-xs text-gray-400 uppercase mb-1">Floor Price</div>
                                                            <div className="text-sm md:text-lg font-bold">
                                                                {collection.floor_price !== null && collection.floor_currency
                                                                    ? `${collection.floor_price.toFixed(6)} ${collection.floor_currency}`
                                                                    : 'N/A'}
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <div className="text-xs text-gray-400 uppercase mb-1">Listings</div>
                                                            <div className="text-sm md:text-lg font-bold">
                                                                {collection.cards_with_listings.toLocaleString()}
                                                            </div>
                                                        </div>

                                                        {collectionVolume?.volume?.['24h'] && (
                                                            <div>
                                                                <div className="text-xs text-gray-400 uppercase mb-1">24h Volume</div>
                                                                <div className="text-sm md:text-lg font-bold text-green-400 flex items-center gap-1">
                                                                    <TrendingUp className="w-4 h-4" />
                                                                    {formatCurrency(collectionVolume.volume['24h'].volume_usd)}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {collectionVolume?.volume?.['7d'] && (
                                                            <div>
                                                                <div className="text-xs text-gray-400 uppercase mb-1">7d Volume</div>
                                                                <div className="text-sm md:text-lg font-bold text-blue-400">
                                                                    {formatCurrency(collectionVolume.volume['7d'].volume_usd)}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Collection Icon */}
                                                <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 z-10">
                                                    <div className="w-16 h-16 md:w-24 md:h-24 bg-[#151b2e] rounded-lg overflow-hidden border-2 border-white/20">
                                                        <img
                                                            src={collection.image}
                                                            alt={collection.symbol}
                                                            className="w-full h-full object-contain"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Previous Button */}
                        <button
                            className="cursor-pointer absolute left-2 md:left-10 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
                            onClick={scrollPrev}
                            aria-label="Previous slide"
                        >
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        {/* Next Button */}
                        <button
                            className="cursor-pointer absolute right-2 md:right-10 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
                            onClick={scrollNext}
                            aria-label="Next slide"
                        >
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                        {/* Pagination Dots */}
                        <div className="flex justify-center gap-2 mb-8 md:mx-6">
                            {allCollections.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => scrollTo(index)}
                                    className={`h-1 rounded-full transition-all ${index === selectedIndex
                                        ? 'w-8 bg-white'
                                        : 'w-1 bg-white/40 hover:bg-white/60'
                                        }`}
                                    aria-label={`Go to slide ${index + 1}`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Top Collections by 7-Day Volume - Table View */}
            <div className="pb-8 px-6">
                <h2 className="text-2xl font-bold mb-2">Top Collections</h2>
                <p className="text-gray-400 text-sm mb-6">Collections by Project</p>

                <div className="bg-background border border-lines rounded-xl overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-4 md:grid-cols-12 gap-4 p-4 border-b border-lines bg-[#1a1d29] text-xs text-gray-400 uppercase font-medium">
                        <div className="col-span-2 md:col-span-3">Collection</div>
                        <div className="hidden md:block md:col-span-2 text-right">Change</div>
                        <div className="hidden md:block md:col-span-2 text-right">Sales</div>
                        <div className="col-span-2 text-right">24h Volume</div>
                        <div className="hidden md:block md:col-span-2 text-right">7d Volume</div>
                        <div className="hidden md:block md:col-span-1 text-right">Vol %</div>
                    </div>

                    {/* Table Body */}
                    <div>
                        {isLoading ? (
                            <div className="p-8 text-center text-gray-400">
                                {/* Loading..... */}
                            </div>
                        ) : (
                            getTopCollectionsByVolume().map((collection, index) => {
                                const volume7d = collection.volumeData?.volume?.['7d']
                                const volume24h = collection.volumeData?.volume?.['24h']

                                // Calculate percentage change (simplified - comparing 24h to avg daily from 7d)
                                const avgDaily7d = volume7d ? volume7d.volume_usd / 7 : 0
                                const change24h = volume24h ? volume24h.volume_usd : 0
                                const percentChange = calculatePercentageChange(change24h, avgDaily7d)

                                // Calculate volume percentage (7d volume as % of total - simplified example)
                                const totalVolume = getTopCollectionsByVolume().reduce((sum, c) =>
                                    sum + (c.volumeData?.volume?.['7d']?.volume_usd || 0), 0
                                )
                                const volumePercent = volume7d ? (volume7d.volume_usd / totalVolume) * 100 : 0

                                return (
                                    <div
                                        key={collection.contract_address}
                                        className="grid grid-cols-4 md:grid-cols-12 gap-4 p-4 border-b border-lines hover:bg-[#1a1d29] cursor-pointer transition-colors"
                                        onClick={() => router.push(`/collection/${collection.contract_address}`)}
                                    >
                                        {/* Collection Name & Icon */}
                                        <div className="col-span-2 md:col-span-3 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-[#2a2d3a] overflow-hidden flex-shrink-0">
                                                <img
                                                    src={collection.image}
                                                    alt={collection.symbol}
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-medium text-sm truncate">
                                                    {collection.name}
                                                </div>
                                            </div>
                                        </div>

                                        {/* 24h Change % - Hidden on mobile */}
                                        <div className="hidden md:block md:col-span-2 text-right">
                                            <div className={`font-bold text-sm flex items-center justify-end gap-1 ${percentChange > 0 ? 'text-green-400' : percentChange < 0 ? 'text-red-400' : 'text-gray-400'
                                                }`}>
                                                {percentChange > 0 ? (
                                                    <TrendingUp className="w-3 h-3" />
                                                ) : percentChange < 0 ? (
                                                    <TrendingDown className="w-3 h-3" />
                                                ) : null}
                                                {percentChange > 0 ? '+' : ''}{percentChange.toFixed(2)}%
                                            </div>
                                        </div>

                                        {/* 7d Sales - Hidden on mobile */}
                                        <div className="hidden md:block md:col-span-2 text-right">
                                            <div className="font-bold text-sm">
                                                {volume7d?.sales.toLocaleString() || '0'}
                                            </div>
                                        </div>

                                        {/* 24h Volume */}
                                        <div className="col-span-2 text-right">
                                            <div className="font-bold text-sm text-green-400">
                                                {volume24h ? formatCurrency(volume24h.volume_usd) : '$0'}
                                            </div>
                                            <div className="text-xs text-gray-400 md:block hidden">
                                                {volume24h?.sales.toLocaleString() || '0'} sales
                                            </div>
                                        </div>

                                        {/* 7d Volume - Hidden on mobile */}
                                        <div className="hidden md:block md:col-span-2 text-right">
                                            <div className="font-bold text-sm">
                                                {volume7d ? formatCurrency(volume7d.volume_usd) : '$0'}
                                            </div>
                                        </div>

                                        {/* Volume Percentage - Hidden on mobile */}
                                        <div className="hidden md:block md:col-span-1 text-right">
                                            <div className="font-bold text-sm text-blue-400">
                                                {volumePercent.toFixed(2)}%
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Projects Section - Grouped by Project */}
            <div className="pb-20 px-6">
                <h2 className="text-2xl font-bold mb-2">Browse Collections</h2>
                <p className="text-gray-400 text-sm mb-6">Explore collections by project</p>

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {isLoading ? (
                        <>
                            {[...Array(6)].map((_, i) => (
                                <ProjectCardSkeleton key={i} />
                            ))}
                        </>
                    ) : (
                        data.projects
                            .filter(project => project.collections.some(c => c.cards_with_listings > 0))
                            .map((project, i) => {
                                const stats = getProjectStats(project)
                                const isExpanded = expandedProjects.has(project.name)
                                const activeCollections = project.collections.filter(c => c.cards_with_listings > 0)

                                return (
                                    <div
                                        key={i}
                                        className="bg-background border border-lines rounded-xl overflow-hidden hover:border-gray-600 transition-colors"
                                    >
                                        {/* Project Header */}
                                        <div className="p-6 border-b border-lines">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-14 h-14 rounded-lg bg-[#1f2937] overflow-hidden flex-shrink-0 border-2 border-white/10">
                                                        <img
                                                            src={activeCollections[0]?.image}
                                                            alt={project.name}
                                                            className="w-full h-full object-contain"
                                                        />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-lg text-white">{project.name}</h3>
                                                        <p className="text-sm text-gray-400">
                                                            {stats.collectionsCount} collection{stats.collectionsCount !== 1 ? 's' : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Project Stats */}
                                            <div className="grid grid-cols-3 gap-4">
                                                <div>
                                                    <div className="text-xs text-gray-400 uppercase mb-1">Listings</div>
                                                    <div className="text-sm font-bold text-green-400">
                                                        {stats.totalListings.toLocaleString()}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-gray-400 uppercase mb-1">Floor</div>
                                                    <div className="text-sm font-bold">
                                                        {stats.lowestFloor
                                                            ? `${stats.lowestFloor.price.toFixed(4)} ${stats.lowestFloor.currency}`
                                                            : 'N/A'}
                                                    </div>
                                                </div>
                                                {stats.total24hVolume > 0 && (
                                                    <div>
                                                        <div className="text-xs text-gray-400 uppercase mb-1">24h Vol</div>
                                                        <div className="text-sm font-bold text-green-400">
                                                            {formatCurrency(stats.total24hVolume)}
                                                        </div>
                                                    </div>
                                                )}
                                                {stats.total7dVolume > 0 && stats.total24hVolume === 0 && (
                                                    <div>
                                                        <div className="text-xs text-gray-400 uppercase mb-1">7d Vol</div>
                                                        <div className="text-sm font-bold text-blue-400">
                                                            {formatCurrency(stats.total7dVolume)}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Collections List */}
                                        <div className="p-4">
                                            <div className="space-y-2">
                                                {activeCollections.slice(0, isExpanded ? undefined : 2).map((collection, idx) => {
                                                    const collectionVolume = volumeData[collection.contract_address]

                                                    return (
                                                        <div
                                                            key={idx}
                                                            className="flex items-center justify-between p-3 bg-[#1a1d29] hover:bg-[#1f2937] rounded-lg cursor-pointer transition-colors group"
                                                            onClick={() => router.push(`/collection/${collection.contract_address}`)}
                                                        >
                                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                <div className="w-10 h-10 rounded-lg bg-[#2a2d3a] overflow-hidden flex-shrink-0">
                                                                    <img
                                                                        src={collection.image}
                                                                        alt={collection.symbol}
                                                                        className="w-full h-full object-contain"
                                                                    />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="font-medium text-sm truncate group-hover:text-white transition-colors">
                                                                        {collection.name}
                                                                    </div>
                                                                    <div className="text-xs text-gray-400 flex items-center gap-2">
                                                                        {collection.symbol}
                                                                        {collectionVolume?.volume?.['24h'] && (
                                                                            <span className="text-green-400 flex items-center gap-0.5">
                                                                                24h: {formatCurrency(collectionVolume.volume['24h'].volume_usd)}
                                                                            </span>
                                                                        )}
                                                                        {collectionVolume?.volume?.['7d'] && (
                                                                            <span className="text-blue-400 flex items-center gap-0.5">
                                                                                7d: {formatCurrency(collectionVolume.volume['7d'].volume_usd)}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col items-end ml-4">
                                                                <div className="text-xs text-gray-400">
                                                                    {collection.cards_with_listings.toLocaleString()} items
                                                                </div>
                                                                <div className="text-xs font-semibold">
                                                                    {collection.floor_price !== null && collection.floor_currency
                                                                        ? `${collection.floor_price.toFixed(4)} ${collection.floor_currency}`
                                                                        : 'No floor'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>

                                            {/* Show More/Less Button */}
                                            {activeCollections.length > 2 && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        toggleProject(project.name)
                                                    }}
                                                    className="cursor-pointer w-full mt-3 py-2 text-sm text-[#2081E2] hover:text-[#1868B7] font-medium flex items-center justify-center gap-1 transition-colors"
                                                >
                                                    {isExpanded ? (
                                                        <>
                                                            Show Less
                                                            <ChevronUp className="w-4 h-4" />
                                                        </>
                                                    ) : (
                                                        <>
                                                            Show {activeCollections.length - 2} More
                                                            <ChevronDown className="w-4 h-4" />
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })
                    )}
                </div>
            </div>
        </div>
    )
}

export default Page