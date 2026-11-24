// Comments as a conversation: the seller's answers are shown on the right.
import { timeAgo, fullDate } from '../../lib/format.js';
import Avatar from '../ui/Avatar.jsx';

export default function CommentThread({ comments, sellerName }) {
  if (comments.length === 0) {
    return <p className="text-muted">No questions yet. Be the first to ask the seller!</p>;
  }

  return (
    <ol className="thread">
      {comments.map((comment) => {
        const bySeller = comment.username === sellerName;
        return (
          <li key={comment.id} className={`thread-item${bySeller ? ' thread-item--seller' : ''}`}>
            <Avatar name={comment.username} size={32} />
            <div className="thread-bubble">
              <div className="thread-author">
                {comment.username}
                {bySeller && <span className="seller-badge">seller</span>}
                <time dateTime={comment.created_at} title={fullDate(comment.created_at)}>
                  {timeAgo(comment.created_at)}
                </time>
              </div>
              <div className="pre-wrap">{comment.text}</div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
