// import { redisClient } from "../config/redis.js";
// import { Request, Response, NextFunction } from "express";
// export const rateLimit = async (req: Request, res: Response, next: NextFunction) => {
//   const key = `rate:${req.ip}`;
//   const now = Date.now();
//   const windowMs = 3600 * 1000; // 1 hour
//   const windowStart = now - windowMs;
//   const maxRequests = 20;

//   try {
//     await redisClient.zRemRangeByScore(key, 0, windowStart);

//     const count = await redisClient.zCard(key);

//     if (count >= maxRequests) {
//       return res.status(429).json({
//         error: "Too many requests. Please try again later.",
//         action: "rate_limit_exceeded",
//       });
//     }

//     await redisClient.zAdd(key, [
//       { score: now, value: Math.random().toString() }
//     ]);

//     await redisClient.expire(key, 3600);

//     next();
//   } catch (err) {
//     console.error("Rate Limit Error:", err);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };