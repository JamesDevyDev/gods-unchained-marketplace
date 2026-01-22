type CardImageProps = {
    image: string
    name: string
}

export const CardImage = ({ image, name }: CardImageProps) => {
    return (
        <div className="w-full lg:w-[40%] bg-background border-b lg:border-b-0 lg:border-r border-lines p-4 sm:p-6">
            <img
                src={image}
                alt={name}
                className="w-full max-w-md mx-auto lg:max-w-none rounded-lg shadow-2xl"
            />
        </div>
    )
}