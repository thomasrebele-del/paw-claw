export const CAMP = { x: -9, z: 16 };
export const SAFE_RADIUS = 12;

export function inSafeZone(x, z) {
  return Math.hypot(x - CAMP.x, z - CAMP.z) <= SAFE_RADIUS;
}

export function tameFood(diet, foods) {
  return (diet || []).find((id) => (foods[id] || 0) > 0) || null;
}

export function followPoint(player, index, count) {
  const side = (index - (count - 1) / 2) * 1.2;
  const yaw = player.yaw || 0;
  return {
    x: player.x - Math.sin(yaw) * 1.7 + Math.cos(yaw) * side,
    z: player.z - Math.cos(yaw) * 1.7 - Math.sin(yaw) * side,
  };
}
