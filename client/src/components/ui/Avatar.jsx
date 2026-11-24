// A round badge with the first letter of a username; the colour is always the same for one name.
const COLORS = ['#0f766e', '#b45309', '#7c3aed', '#be123c', '#1d4ed8', '#4d7c0f', '#c2410c'];

export default function Avatar({ name, size = 36 }) {
  const sum = [...name].reduce((total, char) => total + char.charCodeAt(0), 0);
  const style = {
    width: size,
    height: size,
    fontSize: size * 0.45,
    background: COLORS[sum % COLORS.length],
  };
  return (
    <span className="avatar" style={style} aria-hidden="true">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
