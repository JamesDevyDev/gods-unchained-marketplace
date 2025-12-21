'use client'

import React, { useState, useEffect, useRef } from 'react'

interface Card {
  stack: {
    name: string
    image: string
    stack_id: string
    description: string | null
    attributes: Array<{
      trait_type: string
      value: string | number
      display_type: string | null
    }>
  }
}

interface ApiResponse {
  result: Card[]
  page: {
    next_cursor: string | null
  }
}

interface Quote {
  buy_token_amount: string
  fees: Array<{
    amount: string
    recipient_address: string
    type: string
  }>
  sell_token_address?: string
  sell_token_amount: string
  sell_token_symbol?: string
}

interface QuoteResponse {
  result: Quote[]
}

const CardsPage = () => {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loadingQuote, setLoadingQuote] = useState(false)
  const observerTarget = useRef<HTMLDivElement>(null)

  // Fetch cards from API
  const fetchCards = async (cursor?: string) => {
    setLoading(true)
    try {
      const url = cursor
        ? `https://api.immutable.com/v1/chains/imtbl-zkevm-mainnet/search/stacks?contract_address=0x06d92b637dfcdf95a2faba04ef22b2a096029b69&page_size=200&cursor=${cursor}`
        : `https://api.immutable.com/v1/chains/imtbl-zkevm-mainnet/search/stacks?contract_address=0x06d92b637dfcdf95a2faba04ef22b2a096029b69&page_size=200`

      const response = await fetch(url)
      const data: ApiResponse = await response.json()

      setCards(prev => [...prev, ...data.result])
      setNextCursor(data.page.next_cursor)
    } catch (error) {
      console.error('Error fetching cards:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch quote data for a specific stack_id
  const fetchQuote = async (stackId: string) => {
    console.log("Inside")
    setLoadingQuote(true)
    setQuotes([])
    try {
      console.log('Fetching quote for stack_id:', stackId)
      const url = `https://api.immutable.com/v1/chains/imtbl-zkevm-mainnet/quotes/0x06d92b637dfcdf95a2faba04ef22b2a096029b69/stacks?stack_id=${stackId}`
      console.log('Fetching URL:', url)

      const response = await fetch(url)
      const data: QuoteResponse = await response.json()

      console.log(data)
      setQuotes(data.result || [])
    } catch (error) {
      console.error('Error fetching quote:', error)
      setQuotes([])
    } finally {
      setLoadingQuote(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchCards()
  }, [])

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loading && nextCursor) {
          fetchCards(nextCursor)
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current)
      }
    }
  }, [loading, nextCursor])

  // Fetch quote when card is selected
  useEffect(() => {
    if (selectedCard && isModalOpen) {
      console.log('Modal opened, fetching quote for:', selectedCard.stack.stack_id)
      fetchQuote(selectedCard.stack.stack_id)
    }
  }, [selectedCard, isModalOpen])

  // Format token amount for display
  const formatTokenAmount = (amount: string, decimals: number = 18) => {
    const value = parseFloat(amount) / Math.pow(10, decimals)
    return value.toFixed(6)
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <h1 className="text-4xl font-bold text-white mb-8 text-center">
        Gods Unchained Cards
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-6">
        {cards.map((card, index) => (
          <div
            key={`${card.stack.stack_id}-${index}`}
            className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 hover:scale-105 transform cursor-pointer"
            onClick={() => {
              setSelectedCard(card)
              setIsModalOpen(true)
            }}
          >
            <div className="aspect-[2/3] relative">
              <img
                src={card.stack.image}
                alt={card.stack.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="p-4">
              <h3 className="text-white font-semibold text-center truncate">
                {card.stack.name}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}

      {/* Intersection observer target */}
      <div ref={observerTarget} className="h-10" />

      {/* End message */}
      {!nextCursor && !loading && cards.length > 0 && (
        <p className="text-gray-400 text-center py-8">
          All cards loaded ({cards.length} total)
        </p>
      )}

      {/* Modal */}
      {isModalOpen && selectedCard && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Close button */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="float-right text-gray-400 hover:text-white text-2xl font-bold"
              >
                ×
              </button>

              {/* Card content */}
              <div className="flex flex-col md:flex-row gap-6">
                {/* Card image */}
                <div className="md:w-1/2">
                  <img
                    src={selectedCard.stack.image}
                    alt={selectedCard.stack.name}
                    className="w-full rounded-lg"
                  />
                </div>

                {/* Card details */}
                <div className="md:w-1/2">
                  <h2 className="text-3xl font-bold text-white mb-4">
                    {selectedCard.stack.name}
                  </h2>

                  {selectedCard.stack.description && (
                    <p className="text-gray-300 mb-4">
                      {selectedCard.stack.description}
                    </p>
                  )}

                  <p className="text-gray-400 text-sm mb-4">
                    Stack ID: {selectedCard.stack.stack_id}
                  </p>

                  {/* Quotes Section */}
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-white mb-3">
                      Market Quotes
                    </h3>

                    {loadingQuote ? (
                      <div className="flex justify-center items-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                      </div>
                    ) : quotes.length > 0 ? (
                      <div className="space-y-3">
                        {quotes.map((quote, index) => (
                          <div key={index} className="bg-gray-700 rounded-lg p-4">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-400">Buy Amount:</span>
                                <span className="text-white font-semibold">
                                  {formatTokenAmount(quote.buy_token_amount)} tokens
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-400">Sell Amount:</span>
                                <span className="text-white font-semibold">
                                  {formatTokenAmount(quote.sell_token_amount)} {quote.sell_token_symbol || 'tokens'}
                                </span>
                              </div>
                              {quote.sell_token_address && (
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-400">Sell Token:</span>
                                  <span className="text-white font-mono text-xs">
                                    {quote.sell_token_address.slice(0, 6)}...{quote.sell_token_address.slice(-4)}
                                  </span>
                                </div>
                              )}
                              {quote.fees && quote.fees.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-600">
                                  <span className="text-gray-400 text-sm">Fees:</span>
                                  {quote.fees.map((fee, feeIndex) => (
                                    <div key={feeIndex} className="flex justify-between items-center mt-1 text-sm">
                                      <span className="text-gray-500">{fee.type}:</span>
                                      <span className="text-gray-300">{formatTokenAmount(fee.amount)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-center py-4">
                        No quotes available
                      </p>
                    )}
                  </div>

                  {/* Attributes */}
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Attributes
                    </h3>
                    {selectedCard.stack.attributes.map((attr, index) => (
                      <div
                        key={index}
                        className="bg-gray-700 rounded-lg p-3 flex justify-between items-center"
                      >
                        <span className="text-gray-400 font-medium">
                          {attr.trait_type}
                        </span>
                        <span className="text-white font-semibold">
                          {attr.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CardsPage