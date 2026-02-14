/**
 * @openapi
 * /api/auctions/socket:
 *   post:
 *     summary: Documentacion de eventos Socket.io para subastas en vivo
 *     description: |
 *       Este endpoint existe solo para documentacion en Swagger.
 *       No es invocable por HTTP en runtime.
 *
 *       Namespace: `/auction`
 *
 *       Eventos cliente -> servidor:
 *       - `auction:join` { auctionId }
 *       - `bid:place` { auctionId, lotId, amount }
 *       - `auction:auctioneer:adjudicate` { auctionId, lotId }
 *       - `auction:auctioneer:next-lot` { auctionId, lotId }
 *
 *       Eventos servidor -> cliente:
 *       - `bid:update`
 *       - `lot:active`
 *       - `auction:paused`
 *       - `auction:ended`
 *       - `bid:rejected`
 *     responses:
 *       200:
 *         description: Referencia de eventos Socket.io.
 */
export {};
