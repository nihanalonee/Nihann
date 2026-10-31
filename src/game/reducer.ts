import type { GameState, LedgerEntry, Toast } from "../types";
import { createInitialState } from "./seed";
import {
  applyWorldEvent,
  clamp,
  crimeSuccessChance,
  isMoney,
  netWorth,
  rand,
  randInt,
  roundPrice,
  simulateTick,
  uid,
} from "./engine";

export type Action =
  | { type: "TICK" }
  | { type: "TRADE"; assetId: string; side: "buy" | "sell"; qty: number }
  | { type: "SWAP"; from: string; to: string; amount: number }
  | { type: "MINT"; name: string; ticker: string; supply: number; liquidity: number }
  | { type: "BUY_PROPERTY"; districtId: string }
  | { type: "BUILD_NODE"; districtId: string }
  | { type: "UPGRADE_NODE"; nodeId: string }
  | { type: "REPAIR_NODE"; nodeId: string }
  | { type: "TOGGLE_AUTO_REPAIR" }
  | { type: "SET_ISP_PRICE"; value: number }
  | { type: "BANK_DEPOSIT"; amount: number }
  | { type: "BANK_WITHDRAW"; amount: number }
  | { type: "SET_BANK_RATE"; key: "reserveRatio" | "lendingRate" | "depositRate"; value: number }
  | { type: "ISSUE_BOND"; amount: number }
  | { type: "UNDERWRITE"; borrower: string; amount: number; rate: number }
  | { type: "TRIGGER_RUN" }
  | { type: "LAUNCH_CHANNEL"; name: string; kind: "TV" | "Streaming" | "Podcast" }
  | { type: "PRODUCE_SHOW"; channelId: string; title: string; genre: string; budget: number }
  | {
      type: "RUN_CAMPAIGN";
      channelId: string;
      target: string;
      tone: "hype" | "hit" | "spin";
      budget: number;
    }
  | { type: "CRIME"; opId: string }
  | { type: "LAUNDER"; amount: number }
  | { type: "UPGRADE_LAUNDER" }
  | { type: "BUY_PROTECTION" }
  | { type: "BRIBE" }
  | { type: "HIRE_CREW" }
  | { type: "POST"; content: string }
  | { type: "LIKE"; postId: string }
  | { type: "RND"; amount: number }
  | { type: "CORP_INVEST"; area: "security" | "pr" | "employees"; amount: number }
  | { type: "ESPIONAGE"; rivalId: string }
  | { type: "LOBBY"; billId: string; amount: number }
  | { type: "SET_TAX"; key: "taxRate" | "corpTax"; value: number }
  | { type: "SET_PROFILE"; name?: string; email?: string; handle?: string }
  | { type: "ADMIN_UNLOCK"; email: string }
  | {
      type: "GOD";
      command: "spawn" | "pump" | "crash" | "purge" | "amnesty" | "bailout" | "liquidity" | "deflate";
      target?: string;
    }
  | { type: "APPLY_AI_EVENT"; event: GameState["world"]["events"][number] }
  | { type: "SET_ENGINE_MODE"; mode: "grok" | "local" }
  | { type: "TOGGLE_PAUSE" }
  | { type: "DISMISS_TOAST"; id: string }
  | { type: "RESET" };

function addToast(state: GameState, message: string, tone: Toast["tone"] = "info") {
  state.toasts.push({ id: uid("toast"), message, tone });
  if (state.toasts.length > 4) state.toasts = state.toasts.slice(-4);
}

function addLedger(state: GameState, label: string, amount: number, kind: LedgerEntry["kind"]) {
  state.ledger.unshift({
    id: uid("ledger"),
    label,
    amount: Math.round(amount),
    kind,
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  });
  state.ledger = state.ledger.slice(0, 40);
}

function quote(state: GameState, id: string) {
  return state.assets.find((a) => a.id === id);
}

function applyPriceImpact(price: number, notional: number, liquidity: number, direction: number) {
  const impact = clamp((notional / Math.max(1, liquidity)) * 0.18, 0, 0.045);
  return roundPrice(price * (1 + impact * direction));
}

export function gameReducer(state: GameState, action: Action): GameState {
  const s: GameState = structuredClone(state);

  switch (action.type) {
    case "TICK": {
      simulateTick(s);
      return s;
    }

    case "TRADE": {
      const asset = quote(s, action.assetId);
      const qty = Math.floor(action.qty);
      if (!asset || qty <= 0 || !Number.isFinite(qty)) {
        addToast(s, "Invalid order size.", "error");
        return s;
      }
      const feeRate = asset.kind === "crypto" ? 0.003 : 0.0012;
      const liquidity = asset.kind === "crypto" ? asset.liquidity ?? 500_000 : 8_000_000;
      if (action.side === "buy") {
        const notional = qty * asset.price;
        const total = notional * (1 + feeRate);
        if (total > s.player.cash) {
          addToast(s, `Insufficient liquidity. Need ${isMoney(total)}.`, "error");
          return s;
        }
        s.player.cash -= total;
        const holding = s.holdings[asset.id] ?? { qty: 0, avgCost: asset.price };
        holding.avgCost = (holding.avgCost * holding.qty + notional) / (holding.qty + qty);
        holding.qty += qty;
        s.holdings[asset.id] = holding;
        asset.price = applyPriceImpact(asset.price, notional, liquidity, 1);
        asset.sentiment = clamp(asset.sentiment + 2, -100, 100);
        addLedger(s, `Buy ${qty.toLocaleString()} ${asset.ticker}`, -total, "trade");
        addToast(s, `Filled: bought ${qty.toLocaleString()} ${asset.ticker} for ${isMoney(total)}.`, "success");
        s.stats.totalTrades += 1;
        s.player.xp = Math.min(99.9, s.player.xp + 0.8);
      } else {
        const holding = s.holdings[asset.id];
        if (!holding || holding.qty < qty) {
          addToast(s, `You only hold ${(holding?.qty ?? 0).toLocaleString()} ${asset.ticker}.`, "error");
          return s;
        }
        const notional = qty * asset.price;
        const proceeds = notional * (1 - feeRate);
        holding.qty -= qty;
        if (holding.qty === 0) delete s.holdings[asset.id];
        s.player.cash += proceeds;
        asset.price = applyPriceImpact(asset.price, notional, liquidity, -1);
        asset.sentiment = clamp(asset.sentiment - 2, -100, 100);
        addLedger(s, `Sell ${qty.toLocaleString()} ${asset.ticker}`, proceeds, "trade");
        addToast(s, `Filled: sold ${qty.toLocaleString()} ${asset.ticker} for ${isMoney(proceeds)}.`, "success");
        s.stats.totalTrades += 1;
        s.player.xp = Math.min(99.9, s.player.xp + 0.8);
      }
      asset.history.push(asset.price);
      if (asset.history.length > 96) asset.history.shift();
      s.stats.netWorthHistory.push(netWorth(s));
      return s;
    }

    case "SWAP": {
      const from = quote(s, action.from);
      const to = quote(s, action.to);
      const holding = s.holdings[action.from];
      if (!from || !to || from.id === to.id) {
        addToast(s, "Invalid swap route.", "error");
        return s;
      }
      if (!holding || holding.qty < action.amount || action.amount <= 0) {
        addToast(s, "Insufficient balance for swap.", "error");
        return s;
      }
      const fromLiquidity = from.liquidity ?? 500_000;
      const toLiquidity = to.liquidity ?? 500_000;
      const slippage = clamp((action.amount * from.price) / Math.max(1, fromLiquidity) * 0.2, 0, 0.08);
      const gross = action.amount * from.price;
      const fee = gross * 0.003;
      const received = ((gross - fee) * (1 - slippage)) / to.price;
      holding.qty -= action.amount;
      if (holding.qty <= 0) delete s.holdings[action.from];
      const target = s.holdings[action.to] ?? { qty: 0, avgCost: to.price };
      target.avgCost = (target.avgCost * target.qty + received * to.price) / (target.qty + received);
      target.qty += received;
      s.holdings[action.to] = target;
      from.price = applyPriceImpact(from.price, gross, fromLiquidity, -1);
      to.price = applyPriceImpact(to.price, gross, toLiquidity, 1);
      addLedger(s, `Swap ${from.ticker} → ${to.ticker}`, gross, "trade");
      addToast(
        s,
        `Swap routed: ${action.amount.toLocaleString()} ${from.ticker} → ${received.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${to.ticker} (${(slippage * 100).toFixed(1)}% slippage).`,
        "success",
      );
      s.stats.totalTrades += 1;
      return s;
    }

    case "MINT": {
      const name = action.name.trim();
      const ticker = action.ticker.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
      const supply = Math.max(1_000_000, action.supply);
      const liquidity = Math.max(50_000, action.liquidity);
      if (name.length < 2 || ticker.length < 2) {
        addToast(s, "Token needs a name and a 2–6 character ticker.", "error");
        return s;
      }
      if (s.assets.some((a) => a.ticker === ticker)) {
        addToast(s, `${ticker} is already listed on the exchange.`, "error");
        return s;
      }
      if (liquidity > s.player.cash) {
        addToast(s, `Seed liquidity requires ${isMoney(liquidity)} in cash.`, "error");
        return s;
      }
      const id = uid("token");
      const price = roundPrice(Math.max(0.00001, (liquidity * 2) / supply));
      s.player.cash -= liquidity;
      s.assets.push({
        id,
        name,
        ticker,
        kind: "crypto",
        price,
        prevClose: price,
        history: [price, price * 1.02, price * 0.98, price],
        sector: "Community",
        volatility: 0.09,
        sentiment: 58,
        supply,
        liquidity,
        creator: s.player.handle,
        description: `${name} was minted by ${s.player.name} on the OmniDEX. Community-owned, liquidity-seeded, and extremely volatile.`,
        color: "#7CF7C4",
      });
      s.holdings[id] = { qty: Math.floor(supply * 0.1), avgCost: price };
      addLedger(s, `Mint ${ticker} · seed liquidity`, -liquidity, "expense");
      addToast(s, `${name} ($${ticker}) is live with ${isMoney(liquidity)} of seeded liquidity.`, "success");
      s.player.influence += 25;
      return s;
    }

    case "BUY_PROPERTY": {
      const district = s.districts.find((d) => d.id === action.districtId);
      if (!district || district.owned) {
        addToast(s, "District already in your portfolio.", "error");
        return s;
      }
      const price = Math.round(district.price * 1.02);
      if (price > s.player.cash) {
        addToast(s, `Acquisition requires ${isMoney(price)}.`, "error");
        return s;
      }
      s.player.cash -= price;
      district.owned = true;
      addLedger(s, `Acquire ${district.name}`, -price, "expense");
      addToast(s, `Title deed executed: ${district.name} is now yours.`, "success");
      s.player.prestige += 1;
      return s;
    }

    case "BUILD_NODE": {
      const district = s.districts.find((d) => d.id === action.districtId);
      const cost = 450_000;
      if (!district) return s;
      if (cost > s.player.cash) {
        addToast(s, `Edge node build requires ${isMoney(cost)}.`, "error");
        return s;
      }
      if (s.isp.nodes.some((n) => n.districtId === district.id)) {
        addToast(s, "A node already serves this district.", "error");
        return s;
      }
      s.player.cash -= cost;
      s.isp.nodes.push({
        id: uid("node"),
        name: `${district.name.toUpperCase().replace(/\s+/g, "-")}-EDGE`,
        districtId: district.id,
        capacity: 50,
        load: 12,
        health: 100,
        status: "online",
        latency: 9,
        tier: 1,
      });
      addLedger(s, `Build edge node · ${district.name}`, -cost, "expense");
      addToast(s, `Fiber trench completed. ${district.name} edge node is live.`, "success");
      return s;
    }

    case "UPGRADE_NODE": {
      const node = s.isp.nodes.find((n) => n.id === action.nodeId);
      if (!node) return s;
      if (node.tier >= 5) {
        addToast(s, "Node is already at maximum tier.", "info");
        return s;
      }
      const cost = 220_000 * node.tier;
      if (cost > s.player.cash) {
        addToast(s, `Upgrade requires ${isMoney(cost)}.`, "error");
        return s;
      }
      s.player.cash -= cost;
      node.tier += 1;
      node.capacity += 35;
      node.latency = Math.max(2, node.latency - 2);
      node.health = clamp(node.health + 12, 0, 100);
      addLedger(s, `Upgrade ${node.name} to T${node.tier}`, -cost, "expense");
      addToast(s, `${node.name} upgraded to Tier ${node.tier}. Capacity +35 Gbps.`, "success");
      return s;
    }

    case "REPAIR_NODE": {
      const node = s.isp.nodes.find((n) => n.id === action.nodeId);
      if (!node) return s;
      const cost = 25_000 + Math.round((100 - node.health) * 2_400);
      if (cost > s.player.cash) {
        addToast(s, `Repair requires ${isMoney(cost)}.`, "error");
        return s;
      }
      s.player.cash -= cost;
      node.health = 100;
      node.status = "online";
      addLedger(s, `Repair ${node.name}`, -cost, "expense");
      addToast(s, `${node.name} restored to full health.`, "success");
      return s;
    }

    case "TOGGLE_AUTO_REPAIR": {
      s.isp.autoRepair = !s.isp.autoRepair;
      addToast(s, `Auto-repair ${s.isp.autoRepair ? "engaged" : "disabled"}.`, "info");
      return s;
    }

    case "SET_ISP_PRICE": {
      s.isp.pricePerGb = clamp(action.value, 0.08, 2.5);
      addToast(s, `Wholesale bandwidth repriced to $${s.isp.pricePerGb.toFixed(2)}/Gb.`, "info");
      return s;
    }

    case "BANK_DEPOSIT": {
      const amount = Math.round(action.amount);
      if (amount <= 0 || amount > s.player.cash) {
        addToast(s, "Invalid deposit amount.", "error");
        return s;
      }
      s.player.cash -= amount;
      s.bank.deposits += amount;
      s.bank.reserves += amount;
      addLedger(s, `Deposit · ${s.bank.name}`, -amount, "expense");
      addToast(s, `${isMoney(amount)} deposited into ${s.bank.name}.`, "success");
      return s;
    }

    case "BANK_WITHDRAW": {
      const amount = Math.round(action.amount);
      if (amount <= 0 || amount > s.bank.reserves) {
        addToast(s, "Bank reserves cannot cover that withdrawal.", "error");
        return s;
      }
      s.player.cash += amount;
      s.bank.deposits = Math.max(0, s.bank.deposits - amount);
      s.bank.reserves -= amount;
      addLedger(s, `Withdraw · ${s.bank.name}`, amount, "income");
      addToast(s, `${isMoney(amount)} withdrawn from ${s.bank.name}.`, "success");
      return s;
    }

    case "SET_BANK_RATE": {
      if (action.key === "reserveRatio") s.bank.reserveRatio = clamp(action.value, 5, 60);
      if (action.key === "lendingRate") s.bank.lendingRate = clamp(action.value, 2, 30);
      if (action.key === "depositRate") s.bank.depositRate = clamp(action.value, 0, 15);
      return s;
    }

    case "ISSUE_BOND": {
      const amount = Math.round(action.amount);
      if (amount <= 0) return s;
      s.bank.bonds += amount;
      s.bank.reserves += amount;
      addToast(s, `Corporate bond issued: ${isMoney(amount)} raised into reserves.`, "success");
      return s;
    }

    case "UNDERWRITE": {
      const amount = Math.round(action.amount);
      if (amount < 50_000 || amount > s.bank.deposits * 2.5) {
        addToast(s, "Underwriting size is outside the bank's mandate.", "error");
        return s;
      }
      s.bank.loans += amount;
      s.bank.deposits += Math.round(amount * 0.4);
      s.bank.capital += Math.round(amount * 0.012 * (1 + action.rate / 100));
      s.bank.reserveRatio = clamp(
        (s.bank.reserves / Math.max(1, s.bank.deposits)) * 100,
        5,
        60,
      );
      s.bank.status =
        s.bank.reserves / Math.max(1, s.bank.deposits) < 0.04
          ? "critical"
          : s.bank.reserves / Math.max(1, s.bank.deposits) < s.bank.reserveRatio / 100
            ? "strained"
            : "stable";
      addToast(
        s,
        `${isMoney(amount)} facility underwritten for ${action.borrower} at ${action.rate.toFixed(1)}%.`,
        "success",
      );
      return s;
    }

    case "TRIGGER_RUN": {
      const drained = Math.round(s.bank.deposits * rand(0.18, 0.42));
      s.bank.deposits -= drained;
      s.bank.reserves = Math.max(0, s.bank.reserves - drained);
      s.bank.runs += 1;
      s.bank.status = s.bank.reserves < s.bank.deposits * 0.04 ? "collapsed" : "critical";
      if (s.bank.status === "collapsed") s.bank.capital = 0;
      s.world.news.unshift({
        id: uid("news"),
        text: `Bank run: ${isMoney(drained)} withdrawn from ${s.bank.name}`,
        tone: "negative",
        time: "now",
      });
      addToast(s, `Run triggered. ${isMoney(drained)} drained from reserves.`, "error");
      return s;
    }

    case "LAUNCH_CHANNEL": {
      const cost = 750_000;
      if (cost > s.player.cash) {
        addToast(s, `Broadcast licence requires ${isMoney(cost)}.`, "error");
        return s;
      }
      s.player.cash -= cost;
      s.media.channels.push({
        id: uid("channel"),
        name: action.name.trim() || "Untitled Network",
        type: action.kind,
        reach: 60_000,
        credibility: 55,
        revenue: 1_200,
        color: "#B69CFF",
        shows: [],
      });
      addLedger(s, `Launch ${action.kind} channel`, -cost, "expense");
      addToast(s, `${action.name || "New channel"} is on air. Reach starts at 60K.`, "success");
      return s;
    }

    case "PRODUCE_SHOW": {
      const channel = s.media.channels.find((c) => c.id === action.channelId);
      const budget = Math.round(action.budget);
      if (!channel) return s;
      if (budget < 20_000 || budget > s.player.cash) {
        addToast(s, `Production budget must be at least ${isMoney(20_000)} and within cash.`, "error");
        return s;
      }
      const rating = Math.round(clamp(34 + channel.credibility * 0.42 + budget / 4_200 + rand(-10, 16), 5, 99));
      const revenue = Math.round(budget * (0.45 + rating / 110));
      s.player.cash -= budget;
      channel.shows.push({
        id: uid("show"),
        title: action.title.trim() || "Untitled Pilot",
        genre: action.genre,
        rating,
        cost: budget,
        revenue,
      });
      channel.reach = Math.round(channel.reach * (1 + rating / 900));
      channel.credibility = clamp(channel.credibility + (rating - 55) * 0.08, 0, 100);
      s.media.publicTrust = clamp(s.media.publicTrust + (rating - 50) * 0.04, 0, 100);
      addLedger(s, `Produce ${action.title || "pilot"}`, -budget, "expense");
      addToast(s, `${action.title || "Pilot"} premiered with a ${rating} rating.`, "success");
      return s;
    }

    case "RUN_CAMPAIGN": {
      const channel = s.media.channels.find((c) => c.id === action.channelId);
      const budget = Math.round(action.budget);
      if (!channel) return s;
      if (budget < 25_000 || budget > s.player.cash) {
        addToast(s, `Campaign requires at least ${isMoney(25_000)} and within cash.`, "error");
        return s;
      }
      s.player.cash -= budget;
      const power = clamp(budget / 25_000, 1, 14);
      const asset = s.assets.find(
        (a) => a.id === action.target || a.ticker === action.target.toUpperCase(),
      );
      const rival = s.corporate.rivals.find(
        (r) => r.id === action.target || r.name.toLowerCase() === action.target.toLowerCase(),
      );
      if (action.tone === "hype") {
        if (asset) {
          asset.price = roundPrice(asset.price * (1 + rand(0.012, 0.032) * power));
          asset.sentiment = clamp(asset.sentiment + 4 * power, -100, 100);
        }
        s.world.sentiment = clamp(s.world.sentiment + power * 0.7, 0, 100);
        channel.reach = Math.round(channel.reach * (1 + 0.02 * power));
      } else if (action.tone === "hit") {
        if (asset) {
          asset.price = roundPrice(asset.price * (1 - rand(0.015, 0.045) * power));
          asset.sentiment = clamp(asset.sentiment - 5 * power, -100, 100);
        }
        if (rival) {
          rival.sentiment = clamp(rival.sentiment - 4 * power, -100, 100);
          rival.netWorth = Math.round(rival.netWorth * (1 - 0.004 * power));
        }
        channel.credibility = clamp(channel.credibility - power * 0.7, 0, 100);
        s.media.publicTrust = clamp(s.media.publicTrust - power * 0.4, 0, 100);
      } else {
        s.government.approval = clamp(s.government.approval + power * 1.4, 0, 100);
        if (rival) rival.sentiment = clamp(rival.sentiment + 2 * power, -100, 100);
        channel.credibility = clamp(channel.credibility + power * 0.3, 0, 100);
      }
      s.media.campaigns.unshift({
        id: uid("campaign"),
        channelId: channel.id,
        target: action.target,
        tone: action.tone,
        budget,
        reach: Math.round(channel.reach * clamp(power / 6, 0.15, 1.1)),
        createdAt: s.world.tick,
        status: "live",
      });
      s.media.campaigns = s.media.campaigns.slice(0, 12);
      addLedger(s, `Media campaign · ${action.tone}`, -budget, "expense");
      addToast(s, `${action.tone.toUpperCase()} campaign is live across ${channel.name}.`, "success");
      s.stats.campaignsRun += 1;
      return s;
    }

    case "CRIME": {
      const op = s.underworld.operations.find((o) => o.id === action.opId);
      if (!op) return s;
      if (s.world.tick - op.lastRun < op.cooldown) {
        addToast(s, `Operation on cooldown for ${op.cooldown - (s.world.tick - op.lastRun)} more ticks.`, "warning");
        return s;
      }
      const success = Math.random() * 100 < crimeSuccessChance(op, s.underworld.heat + s.underworld.crew * 2);
      op.lastRun = s.world.tick;
      if (success) {
        const gross = Math.round(rand(op.minReward, op.maxReward));
        s.underworld.dirtyCash += gross;
        s.underworld.heat = clamp(s.underworld.heat + op.heat, 0, 100);
        s.stats.crimesCommitted += 1;
        s.stats.lifetimeEarnings += gross;
        addLedger(s, `Crime · ${op.name}`, gross, "crime");
        addToast(s, `${op.name} succeeded. ${isMoney(gross)} in dirty cash secured.`, "success");
      } else {
        const fine = Math.min(s.player.cash, randInt(18_000, 60_000));
        s.player.cash -= fine;
        s.underworld.heat = clamp(s.underworld.heat + op.heat * 1.5, 0, 100);
        s.player.reputation = clamp(s.player.reputation - 2, 0, 100);
        if (Math.random() < 0.18 && s.underworld.crew > 0) s.underworld.crew -= 1;
        addLedger(s, `Crime · ${op.name} failed`, -fine, "crime");
        addToast(s, `${op.name} went sideways. ${isMoney(fine)} lost, heat spiking.`, "error");
      }
      return s;
    }

    case "LAUNDER": {
      const amount = Math.round(action.amount);
      if (amount <= 0 || amount > s.underworld.dirtyCash) {
        addToast(s, "Not enough dirty cash to launder.", "error");
        return s;
      }
      s.underworld.dirtyCash -= amount;
      const net = Math.round(amount * 0.82);
      s.player.cash += net;
      s.underworld.heat = clamp(s.underworld.heat + 1.8, 0, 100);
      addLedger(s, "Launder · shell network", net, "crime");
      addToast(s, `${isMoney(amount)} laundered → ${isMoney(net)} clean. 18% fee.`, "success");
      return s;
    }

    case "UPGRADE_LAUNDER": {
      const cost = 180_000;
      if (s.player.cash < cost) {
        addToast(s, `Shell network expansion requires ${isMoney(cost)}.`, "error");
        return s;
      }
      s.player.cash -= cost;
      s.underworld.laundering += 18_000;
      s.underworld.heat = clamp(s.underworld.heat + 2, 0, 100);
      addLedger(s, "Expand laundering network", -cost, "expense");
      addToast(s, `Laundering capacity expanded to ${isMoney(s.underworld.laundering)}/tick.`, "success");
      return s;
    }

    case "BUY_PROTECTION": {
      const cost = 250_000;
      if (s.player.cash < cost) {
        addToast(s, `Protection requires ${isMoney(cost)}.`, "error");
        return s;
      }
      if (s.underworld.protection >= 5) {
        addToast(s, "Every relevant official is already on the payroll.", "info");
        return s;
      }
      s.player.cash -= cost;
      s.underworld.protection += 1;
      s.underworld.heat = clamp(s.underworld.heat - 6, 0, 100);
      addLedger(s, "Protection payments", -cost, "crime");
      addToast(s, `Protection level ${s.underworld.protection}. Heat decay accelerated.`, "success");
      return s;
    }

    case "BRIBE": {
      const cost = 90_000;
      if (s.player.cash < cost) {
        addToast(s, `Bribery requires ${isMoney(cost)} in clean cash.`, "error");
        return s;
      }
      s.player.cash -= cost;
      s.underworld.heat = clamp(s.underworld.heat - 16, 0, 100);
      s.government.regulatoryPressure = clamp(s.government.regulatoryPressure - 6, 0, 100);
      s.government.approval = clamp(s.government.approval + 1, 0, 100);
      if (s.underworld.warrants > 0 && Math.random() < 0.45) {
        s.underworld.warrants -= 1;
        s.government.warrants = Math.max(0, s.government.warrants - 1);
      }
      addLedger(s, "Regulatory bribe", -cost, "crime");
      addToast(s, "Official compensated. Heat reduced by 16.", "success");
      return s;
    }

    case "HIRE_CREW": {
      const cost = 120_000;
      if (s.player.cash < cost) {
        addToast(s, `Recruiting requires ${isMoney(cost)}.`, "error");
        return s;
      }
      if (s.underworld.crew >= 12) {
        addToast(s, "Your crew is already at maximum strength.", "info");
        return s;
      }
      s.player.cash -= cost;
      s.underworld.crew += 1;
      s.underworld.heat = clamp(s.underworld.heat + 2, 0, 100);
      addLedger(s, "Recruit underworld specialist", -cost, "expense");
      addToast(s, `Crew expanded to ${s.underworld.crew}. Success odds improved.`, "success");
      return s;
    }

    case "POST": {
      const content = action.content.trim();
      if (content.length < 2) {
        addToast(s, "Say something worth posting.", "error");
        return s;
      }
      s.posts.unshift({
        id: uid("post"),
        author: s.player.name,
        handle: s.player.handle,
        role: "Founder · Axiom Industries",
        content,
        time: "now",
        likes: 0,
        replies: 0,
        reposts: 0,
        sentiment: "neutral",
        tags: ["$OMN", "$OMX"],
        verified: true,
        color: "#7CF7C4",
        isPlayer: true,
      });
      s.posts = s.posts.slice(0, 40);
      s.player.influence += 8;
      s.player.reputation = clamp(s.player.reputation + 0.6, 0, 100);
      addToast(s, "Transmission live on The Wire.", "success");
      return s;
    }

    case "LIKE": {
      const post = s.posts.find((p) => p.id === action.postId);
      if (!post) return s;
      post.liked = !post.liked;
      post.likes += post.liked ? 1 : -1;
      return s;
    }

    case "RND": {
      const amount = Math.round(action.amount);
      if (amount <= 0 || amount > s.player.cash) {
        addToast(s, "Invalid R&D allocation.", "error");
        return s;
      }
      s.player.cash -= amount;
      s.corporate.rnd = clamp(s.corporate.rnd + amount / 24_000, 0, 100);
      s.corporate.valuation = Math.round(s.corporate.valuation + amount * 1.35);
      s.corporate.employees += amount >= 250_000 ? 3 : 1;
      addLedger(s, "Corporate R&D program", -amount, "expense");
      addToast(s, `${isMoney(amount)} deployed to R&D. Valuation expanded.`, "success");
      return s;
    }

    case "CORP_INVEST": {
      const amount = Math.round(action.amount);
      if (amount < 50_000 || amount > s.player.cash) {
        addToast(s, "Allocation must be at least $50K and within cash.", "error");
        return s;
      }
      s.player.cash -= amount;
      if (action.area === "security") {
        s.corporate.security = clamp(s.corporate.security + amount / 30_000, 0, 100);
        addToast(s, `Corporate security reinforced (${s.corporate.security.toFixed(0)}/100).`, "success");
      } else if (action.area === "pr") {
        s.corporate.pr = clamp(s.corporate.pr + amount / 33_000, 0, 100);
        s.player.reputation = clamp(s.player.reputation + amount / 100_000, 0, 100);
        addToast(s, `PR apparatus expanded (${s.corporate.pr.toFixed(0)}/100).`, "success");
      } else {
        s.corporate.employees += Math.max(1, Math.floor(amount / 70_000));
        s.corporate.valuation = Math.round(s.corporate.valuation + amount * 0.9);
        addToast(s, `Headcount expanded to ${s.corporate.employees}.`, "success");
      }
      s.corporate.valuation = Math.round(s.corporate.valuation + amount * 0.55);
      addLedger(s, `Corporate investment · ${action.area}`, -amount, "expense");
      return s;
    }

    case "ESPIONAGE": {
      const rival = s.corporate.rivals.find((r) => r.id === action.rivalId);
      if (!rival) return s;
      const cost = 100_000;
      if (s.player.cash < cost) {
        addToast(s, `Espionage operation requires ${isMoney(cost)}.`, "error");
        return s;
      }
      s.player.cash -= cost;
      const success = Math.random() * 100 < 40 + s.corporate.security * 0.5 - rival.aggression * 0.22;
      if (success) {
        const stolen = Math.min(1_800_000, Math.round(rival.netWorth * rand(0.001, 0.006)));
        s.player.cash += stolen;
        s.corporate.rnd = clamp(s.corporate.rnd + 4, 0, 100);
        s.corporate.valuation = Math.round(s.corporate.valuation * 1.03);
        rival.sentiment = clamp(rival.sentiment - 8, -100, 100);
        s.underworld.heat = clamp(s.underworld.heat + 4, 0, 100);
        addLedger(s, `Espionage · ${rival.name}`, stolen, "crime");
        addToast(s, `Operation clean. ${isMoney(stolen)} extracted from ${rival.name}.`, "success");
      } else {
        s.underworld.heat = clamp(s.underworld.heat + 11, 0, 100);
        s.player.reputation = clamp(s.player.reputation - 4, 0, 100);
        rival.aggression = clamp(rival.aggression + 4, 0, 100);
        addToast(s, `Operation burned. ${rival.name} traced the intrusion.`, "error");
      }
      addLedger(s, `Espionage · ${rival.name}`, -cost, "expense");
      return s;
    }

    case "LOBBY": {
      const bill = s.government.bills.find((b) => b.id === action.billId);
      const amount = Math.round(action.amount);
      if (!bill || amount < 100_000 || amount > s.player.cash) {
        addToast(s, "Lobbying requires at least $100K and available cash.", "error");
        return s;
      }
      s.player.cash -= amount;
      const votes = randInt(1, 6) + Math.round(amount / 120_000);
      bill.votes = clamp(bill.votes + votes, 0, 100);
      bill.status = "voting";
      s.player.influence += 20;
      addLedger(s, `Lobbying · ${bill.title}`, -amount, "expense");
      addToast(s, `${isMoney(amount)} in "consulting fees" moved ${votes} votes.`, "success");
      return s;
    }

    case "SET_TAX": {
      if (action.key === "taxRate") s.government.taxRate = clamp(action.value, 5, 45);
      else s.government.corpTax = clamp(action.value, 5, 40);
      return s;
    }

    case "SET_PROFILE": {
      if (action.name !== undefined) s.player.name = action.name.slice(0, 40);
      if (action.handle !== undefined) s.player.handle = action.handle.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 24);
      if (action.email !== undefined) {
        s.player.email = action.email.trim().slice(0, 80);
        if (s.player.email.toLowerCase() === "mirajx132@gmail.com") {
          s.player.isAdmin = true;
          addToast(s, "ROOT ACCESS GRANTED. God terminal unlocked.", "warning");
        }
      }
      return s;
    }

    case "ADMIN_UNLOCK": {
      if (action.email.trim().toLowerCase() === "mirajx132@gmail.com") {
        s.player.isAdmin = true;
        s.player.email = "mirajx132@gmail.com";
        addToast(s, "Identity verified. The city is now a sandbox.", "warning");
      } else {
        addToast(s, "Access denied. This terminal is not for you.", "error");
      }
      return s;
    }

    case "GOD": {
      if (!s.player.isAdmin) {
        addToast(s, "God mode is locked.", "error");
        return s;
      }
      switch (action.command) {
        case "spawn": {
          s.player.cash += 1_000_000_000;
          s.player.influence += 9_999;
          addToast(s, "Treasury conjured: $1,000,000,000 credited.", "warning");
          break;
        }
        case "pump": {
          const targets = action.target
            ? s.assets.filter((asset) => asset.id === action.target)
            : s.assets;
          targets.forEach((asset) => {
            asset.price = roundPrice(asset.price * 1.35);
            asset.sentiment = 96;
            asset.history.push(asset.price);
          });
          if (!action.target) {
            s.world.sentiment = 97;
            s.world.index = Math.round(s.world.index * 1.35);
          }
          addToast(s, action.target ? `${action.target.toUpperCase()} pumped +35%.` : "Market-wide pump executed. Everything is green.", "warning");
          break;
        }
        case "crash": {
          const targets = action.target
            ? s.assets.filter((asset) => asset.id === action.target)
            : s.assets;
          targets.forEach((asset) => {
            asset.price = roundPrice(asset.price * 0.58);
            asset.sentiment = 2;
            asset.history.push(asset.price);
          });
          if (!action.target) {
            s.world.sentiment = 4;
            s.world.volatility = 98;
            s.world.index = Math.round(s.world.index * 0.58);
          }
          addToast(s, action.target ? `${action.target.toUpperCase()} crashed -42%.` : "Market-wide crash executed. Liquidations cascading.", "warning");
          break;
        }
        case "purge": {
          const target = action.target;
          if (target) {
            s.corporate.rivals = s.corporate.rivals.filter((r) => r.id !== target);
            addToast(s, "Entity erased from the registry. No trace remains.", "warning");
          } else {
            s.corporate.rivals.forEach((r) => (r.netWorth = Math.round(r.netWorth * 0.1)));
            addToast(s, "Rival balance sheets wiped by 90%.", "warning");
          }
          break;
        }
        case "amnesty": {
          s.underworld.heat = 0;
          s.underworld.warrants = 0;
          s.government.warrants = 0;
          s.government.regulatoryPressure = 0;
          addToast(s, "All warrants voided. All heat erased.", "warning");
          break;
        }
        case "bailout": {
          s.bank.reserves += 10_000_000;
          s.bank.capital += 10_000_000;
          s.bank.status = "stable";
          s.bank.bonds = 0;
          addToast(s, "Bank recapitalised with $10M in freshly printed reserves.", "warning");
          break;
        }
        case "liquidity": {
          s.assets.forEach((a) => {
            if (a.kind === "crypto") a.liquidity = (a.liquidity ?? 0) + 5_000_000;
          });
          addToast(s, "All DEX pools deepened by $5M.", "warning");
          break;
        }
        case "deflate": {
          s.player.cash = Math.round(s.player.cash * 0.5);
          addToast(s, "50% of liquid cash burned. For science.", "warning");
          break;
        }
      }
      return s;
    }

    case "APPLY_AI_EVENT": {
      applyWorldEvent(s, { ...action.event, source: "grok" });
      s.world.engineMode = "grok";
      addToast(s, `Grok world engine: ${action.event.title}`, "info");
      return s;
    }

    case "SET_ENGINE_MODE": {
      s.world.engineMode = action.mode;
      return s;
    }

    case "TOGGLE_PAUSE": {
      s.world.paused = !s.world.paused;
      addToast(s, s.world.paused ? "Simulation paused." : "Simulation resumed.", "info");
      return s;
    }

    case "DISMISS_TOAST": {
      s.toasts = s.toasts.filter((t) => t.id !== action.id);
      return s;
    }

    case "RESET": {
      const fresh = createInitialState();
      fresh.toasts = [{ id: uid("toast"), message: "New timeline initialised. Day 412.", tone: "info" }];
      return fresh;
    }

    default:
      return s;
  }
}
