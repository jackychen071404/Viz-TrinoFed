export default function Help() {
  return (
    <div>
      <h1>Help</h1>
      <p>Meanings of the colors and icons:</p>
      <ul>
        <li>Blue with a check mark: The query is finished successfully.</li>
        <li>Red with a sad face: The query has failed.</li>
        <li>Grey with a question mark: The query status is unknown.</li>
        <li>White with an hourglass: The query is queued.</li>
        <li>Green with a happy face: The query is running successfully.</li>
        <li>Yellow with a neutral face: The query is running with high latency.</li>
      </ul>
      <p>To copy the query ID, click the copy icon on the top right of the query node.
      <br />
      To see more query details, click the expand icon on the top right of the query node.
      <br />
      To see the query history, click the query history button in the navigation bar.
      <br />
      To see the current query, click the current query button in the navigation bar.
      </p>
    </div>
  );
}
