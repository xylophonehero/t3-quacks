import NextError from 'next/error'
import { NextPage } from "next";
import { useRouter } from "next/router";
import { trpc } from "../../utils/trpc";
import { Player } from '@prisma/client';
import { chips } from '../../data/gameData';
import Button from '../../components/ui/Button';
import Chip from '../../components/ui/Chip';

const Game: NextPage = () => {
  const id = useRouter().query.id as string
  const gameQuery = trpc.useQuery(['game.byId', { id }])
  const mutation = trpc.useMutation(['game.move.drawChip'])
  const stop = trpc.useMutation(['game.move.stop'])

  if (gameQuery.error) {
    return <NextError
      title={gameQuery.error.message}
      statusCode={gameQuery.error.data?.httpStatus ?? 500} />
  }

  if (gameQuery.status !== 'success') return (
    <div>...Loading</div>
  )

  const { data } = gameQuery
  const { players } = data
  const player = players[0] as Player
  const handleDrawChip = () => {
    mutation.mutate({ playerId: player.id }, {
      onSuccess: () => gameQuery.refetch()
    })
  }
  const handleStop = () => {
    stop.mutate({ playerId: player.id, gameId: id }, {
      onSuccess: () => gameQuery.refetch()
    })
  }

  const totalWhites = player.chipsOnBoard.reduce((acc, chip) => {
    if (chips[chip]!.color !== 'white') return acc
    return acc + chips[chip]!.value
  }, 0)
  const hasExploded = totalWhites > 7

  return <>
    <pre>{JSON.stringify(data, null, 2)}</pre>
    <div className='p-4 space-y-4'>
      <div className='flex space-x-3'>
        {player.chipsOnBoard.map((chip, index) => (
          <Chip key={index} id={chip} />
        ))}
      </div>
      {hasExploded
        ? <div>
          <p>You exploded</p>
          <Button onClick={handleStop}>Stop</Button>
        </div>
        : <div className='flex space-x-4'>
          <Button onClick={handleDrawChip}>Draw chip</Button>
          <Button onClick={handleStop}>Stop</Button>
        </div>}

    </div>
  </>
}

export default Game
