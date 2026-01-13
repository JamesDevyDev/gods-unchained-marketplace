'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Autoplay from 'embla-carousel-autoplay'
import useEmblaCarousel from 'embla-carousel-react'
import { useRouter } from 'next/navigation'

const Page = () => {

    const router = useRouter()
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 4000 })])
    const [selectedIndex, setSelectedIndex] = useState(0)

    // Sample data based on your example
    const data = {
        "projects": [
            {
                "collections": [
                    {
                        "background_image": "https://wallpapercave.com/wp/wp12467247.jpg",
                        "cards_with_listings": 10158,
                        "contract_address": "0x06d92b637dfcdf95a2faba04ef22b2a096029b69",
                        "floor_currency": "USDC",
                        "floor_price": 9.174e-15,
                        "floor_price_usd": null,
                        "image": "https://images.godsunchained.com/misc/gu-sigel.png",
                        "min_price": "9174",
                        "name": "Gods Unchained Cards",
                        "symbol": "GUCA"
                    },
                    {
                        "background_image": "https://wallpapercave.com/wp/wp12467251.jpg",
                        "cards_with_listings": 211,
                        "contract_address": "0xafb4ba96c44297250bec01e3185ca5154ba6c471",
                        "floor_currency": "USDC",
                        "floor_price": 1.834862e-12,
                        "floor_price_usd": null,
                        "image": "https://images.godsunchained.com/misc/gu-sigel.png",
                        "min_price": "1834862",
                        "name": "Gods Unchained Cosmetics",
                        "symbol": "GUCO"
                    }
                ],
                "name": "Gods Unchained"
            },
            {
                "collections": [
                    {
                        "background_image": "https://www.blockchaingamer.biz/wp-content/uploads/2023/03/hunters16.9.jpg",
                        "cards_with_listings": 1082,
                        "contract_address": "0xae45ba8d0806e23323ff6bcea8520683cee8d74f",
                        "floor_currency": "USDC",
                        "floor_price": 8.96861e-13,
                        "floor_price_usd": null,
                        "image": "https://hunt-nft.cdn.boombit.cloud/External/GENESIS_Hunters.png",
                        "min_price": "896861",
                        "name": "Hunters On Chain - Genesis Hunters",
                        "symbol": "Genesis Hunters"
                    }
                ],
                "name": "Other Collections"
            }
        ]
    }

    // Flatten all collections for carousel
    const allCollections = data.projects.flatMap(project => project.collections)

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

    return (
        <div className="pt-20">
            {/* Featured Collection Carousel - Full width on mobile */}
            <div className="relative group">
                <div className="overflow-hidden rounded-none md:rounded-2xl md:mx-6 mb-2" ref={emblaRef}>
                    <div className="flex">
                        {allCollections.map((collection, index) => (
                            <div key={index} className="flex-[0_0_100%] min-w-0" onClick={() => {
                                console.log("Hello world")
                                console.log(collection)
                                router.push(`/collection/${collection?.contract_address}`)
                            }}>

                                <div className="relative h-96 overflow-hidden cursor-pointer">
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
                                    <div className="absolute bottom-0 left-0 p-4 md:p-8 z-10">
                                        <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">{collection.name}</h2>
                                        <p className="text-xs md:text-sm text-gray-300 mb-4">Symbol: {collection.symbol}</p>

                                        <div className="flex gap-4 md:gap-8 bg-[#0a0e1a]/90 rounded-lg p-3 md:p-4 backdrop-blur">
                                            <div>
                                                <div className="text-xs text-gray-400 uppercase mb-1">Floor Price</div>
                                                <div className="text-sm md:text-lg font-bold">{collection.floor_price?.toFixed(6)} {collection.floor_currency}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-400 uppercase mb-1">Listings</div>
                                                <div className="text-sm md:text-lg font-bold">{collection.cards_with_listings.toLocaleString()}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-400 uppercase mb-1">Min Price</div>
                                                <div className="text-sm md:text-lg font-bold">{collection.min_price}</div>
                                            </div>
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
                        ))}
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
            </div>

            {/* Trending Tokens Section */}
            <div className="mb-8 px-6">
                <h2 className="text-2xl font-bold mb-2">Trending Collections</h2>
                <p className="text-gray-400 text-sm mb-6">Most active collections</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {allCollections.map((collection, i) => (
                        <div key={i} className="bg-[#151b2e] rounded-xl p-4 hover:bg-[#1f2937] transition cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-[#1f2937] overflow-hidden flex-shrink-0">
                                    <img
                                        src={collection.image}
                                        alt={collection.symbol}
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold truncate">{collection.symbol}</div>
                                    <div className="text-sm text-gray-400">
                                        {collection.floor_price?.toFixed(6)} {collection.floor_currency}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="text-xs text-gray-400">Listings</div>
                                    <div className="text-sm font-semibold text-green-400">{collection.cards_with_listings}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Page