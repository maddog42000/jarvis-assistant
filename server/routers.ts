import { COOKIE_NAME } from "../shared/const.js";
import { invokeLLM } from "./_core/llm";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const proxyWindows = new Map<string, { startedAt: number; count: number }>();
const PROXY_WINDOW_MS = 10 * 60 * 1000;
const PROXY_MAX_REQUESTS = 20;

function enforceProxyLimit(request: { ip?: string; headers: Record<string, string | string[] | undefined> }) {
  const forwarded = request.headers['x-forwarded-for'];
  const forwardedIp = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0];
  const clientKey = request.ip ?? forwardedIp ?? 'unknown-client';
  const now = Date.now();
  const current = proxyWindows.get(clientKey);
  if (!current || now - current.startedAt >= PROXY_WINDOW_MS) {
    proxyWindows.set(clientKey, { startedAt: now, count: 1 });
    return;
  }
  if (current.count >= PROXY_MAX_REQUESTS) {
    throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'The server assistant is temporarily rate-limited. Please try again in a few minutes.' });
  }
  current.count += 1;
}

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  assistant: router({
    complete: publicProcedure
      .input(z.object({
        systemPrompt: z.string().trim().min(1).max(4000),
        messages: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string().trim().min(1).max(3000),
        })).min(1).max(12),
      }))
      .mutation(async ({ input, ctx }) => {
        enforceProxyLimit(ctx.req);
        const result = await invokeLLM({
          messages: [
            { role: "system", content: input.systemPrompt },
            ...input.messages,
          ],
          maxTokens: 500,
        });
        const content = result.choices[0]?.message?.content;
        if (typeof content !== "string" || !content.trim()) {
          throw new Error("The server assistant returned no text.");
        }
        return { content: content.trim(), model: result.model };
      }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
