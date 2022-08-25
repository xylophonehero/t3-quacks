import type { NextPage } from "next";
import { useRouter } from "next/router";
import { trpc } from "../utils/trpc";

const Home: NextPage = () => {
  const router = useRouter()
  const mutations = trpc.useMutation(['game.create'], {
    onSuccess: ({ id }) => {
      router.push(`/game/${id}`)
    }
  })


  return (
    <button onClick={() => mutations.mutate()} disabled={mutations.isLoading}>
      Create game
    </button>
  )
}

export default Home;
