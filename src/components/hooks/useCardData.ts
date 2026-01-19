import { useState, useEffect } from 'react'
import type { Stack, Contract, ApiResponse, Stats } from '@/app/types'

export const useCardData = (contract_address: string) => {
    const [contractData, setContractData] = useState<Contract>()
    const [cards, setCards] = useState<Stack[]>([])
    const [stats, setStats] = useState<Stats>()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchCards = async () => {
        if (!contract_address) return

        setCards([])
        setContractData(undefined)
        setStats(undefined)
        setLoading(true)
        setError(null)

        try {
            const searchParams = new URLSearchParams(window.location.search)
            const walletAddress = searchParams.get('wallet')

            let url: string
            const url2 = `${process.env.NEXT_PUBLIC_API_BASE_URL!}/api/collections/${contract_address}`

            if (walletAddress) {
                url = `${process.env.NEXT_PUBLIC_API_BASE_URL!}/api/users/${walletAddress}/nfts?contract=${contract_address}`
            } else {
                url = `${process.env.NEXT_PUBLIC_API_BASE_URL!}/api/collections/${contract_address}/all-stacks`
            }

            const response = await fetch(url)
            const response2 = await fetch(url2)

            if (!response.ok) {
                console.warn(`HTTP error! status: ${response.status}`)
            }
            if (!response2.ok) {
                console.warn(`HTTP error! status: ${response2.status}`)
            }

            const data: ApiResponse = await response.json()
            const data2 = await response2.json()

            // console.log(data) //

            setCards(data.stacks || [])
            setContractData(data2)
            setStats(data.stats) //

            if (data.cached) {
                console.log('Data served from cache')
            } else {
                console.log('Fresh data from database')
            }
        } catch (error) {
            console.error('Error fetching cards:', error)
            setError(error instanceof Error ? error.message : 'Failed to fetch cards')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (contract_address) {
            fetchCards()
        }
    }, [contract_address])

    return {
        contractData,
        cards,
        stats,
        loading,
        error,
        fetchCards
    }
}