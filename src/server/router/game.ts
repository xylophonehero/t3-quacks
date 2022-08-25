import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { board, chips, defaultPlayer, initialChips } from "../../data/gameData";
import { createRouter } from "./context";

const defaultGameSelect = Prisma.validator<Prisma.GameSelect>()({
  id: true,
  phase: true,
  players: true,
  round: true,
})

const defaultPlayerSelect = Prisma.validator<Prisma.PlayerSelect>()({
  id: true,
  chipsInBag: true,
  chipsOnBoard: true,
})

export const gameRouter = createRouter()
  .query('byId', {
    input: z.object({
      id: z.string()
    }),
    async resolve({ ctx, input }) {
      const { id } = input
      const game = await ctx.prisma.game.findUnique({
        where: { id },
        select: defaultGameSelect,
      })
      if (!game) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `No game with id ${id}`
        })
      }
      return game
    }
  })
  .mutation('create', {
    async resolve({ ctx }) {
      const game = await ctx.prisma.game.create({
        data: {
          phase: 'drawing',
        },
        select: defaultGameSelect,
      })
      await ctx.prisma.player.create({
        data: {
          chipsInBag: initialChips,
          name: 'Nick',
          chipsOnBoard: [],
          gameId: game.id,
        },
      })
      return game
    }
  })
  .mutation('move.drawChip', {
    input: z.object({
      playerId: z.string(),
    }),
    async resolve({ ctx, input }) {
      const { playerId } = input
      const player = await ctx.prisma.player.findUnique({
        where: { id: playerId },
        select: {
          chipsInBag: true,
          chipsOnBoard: true,
        }
      })
      if (!player) throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'player not found'
      })

      const { chipsInBag, chipsOnBoard } = player
      const randomIndex = Math.floor(chipsInBag.length * Math.random())
      const selectedChip = chipsInBag[randomIndex]
      if (!selectedChip) throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'No more chips',
      })

      await ctx.prisma.player.update({
        where: { id: playerId },
        data: {
          chipsInBag: [...chipsInBag.slice(0, randomIndex), ...chipsInBag.slice(randomIndex + 1)],
          chipsOnBoard: [...chipsOnBoard, selectedChip],
        }
      })
    }
  })
  .mutation('move.stop', {
    input: z.object({
      playerId: z.string(),
      gameId: z.string()
    }),
    async resolve({ ctx, input }) {
      const { playerId, gameId } = input
      const player = await ctx.prisma.player.findUnique({
        where: { id: playerId },
        select: {
          chipsOnBoard: true,
          chipsInBag: true,
          ratValue: true,
          dropletValue: true,
          rubies: true,
          points: true,
        }
      })
      const game = await ctx.prisma.game.findUnique({
        where: { id: gameId },
        select: {
          round: true,
        }
      })
      if (!game) throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'game not found'
      })
      if (!player) throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'player not found'
      })
      const { ratValue, dropletValue, chipsOnBoard, rubies, chipsInBag, points: currentPoints } = player
      const spacesMoved = ratValue + dropletValue + chipsOnBoard.reduce((acc, val) => acc + chips[val]!.value, 0)
      const { points, ruby } = board[spacesMoved]!

      await ctx.prisma.player.update({
        where: { id: playerId },
        data: {
          chipsInBag: [...chipsInBag, ...chipsOnBoard, 'b1'],
          chipsOnBoard: [],
          rubies: rubies + Number(ruby),
          points: currentPoints + points,
        }
      })

      await ctx.prisma.game.update({
        where: { id: gameId },
        data: {
          round: game.round + 1,
        }
      })
    }
  })