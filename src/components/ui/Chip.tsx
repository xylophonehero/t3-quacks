import { chips } from "../../data/gameData"

interface Props {
  id: string
}

const Chip = ({ id }: Props) => {
  const { color, value } = chips[id]!

  return <div data-color={color} className="chip rounded-full text-white h-10 w-10 grid place-items-center">
    {value}
  </div>
}
export default Chip