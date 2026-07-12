import "./HowItWorksPage.scss";

interface Props {
  onBack: () => void;
}

function HowItWorksPage({ onBack }: Props) {
  return (
    <article className="how-it-works">
      <header className="how-it-works__header">
        <button className="how-it-works__back" onClick={onBack} type="button">
          &lt; Back
        </button>
        <h1 className="how-it-works__title">How It Works</h1>
        <p className="how-it-works__lead">
          A walkthrough of the algorithm behind the Resistor Network Calculator.
        </p>
      </header>

      <section className="how-it-works__section">
        <h2>The Problem</h2>
        <p>
          When building electronics, you often need a specific resistance value — say 660&nbsp;Ω — but
          your parts drawer only contains standard values like 100&nbsp;Ω, 220&nbsp;Ω, 470&nbsp;Ω, and 1&nbsp;kΩ.
          No single resistor matches exactly. The solution: combine multiple resistors in{" "}
          <strong>series</strong> or <strong>parallel</strong> to get close to your target.
        </p>
        <p>
          With even a modest set of values the number of possible networks grows quickly. This app
          solves that search problem automatically and presents the results ranked by the
          complexity–accuracy trade-off.
        </p>
      </section>

      <section className="how-it-works__section">
        <h2>Standard Resistor Series</h2>
        <p>
          Resistors are manufactured in standardised value sets called <strong>E-series</strong>.
          Each series divides a single decade (e.g. 1–10&nbsp;Ω) into a fixed number of steps,
          spaced roughly logarithmically so that the tolerance bands of adjacent values overlap.
        </p>
        <table className="how-it-works__table">
          <thead>
            <tr>
              <th>Series</th>
              <th>Steps per decade</th>
              <th>Nominal tolerance</th>
              <th>Base values</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>E3</td><td>3</td><td>±40 %</td><td>1.0, 2.2, 4.7</td></tr>
            <tr><td>E6</td><td>6</td><td>±20 %</td><td>1.0, 1.5, 2.2, 3.3, 4.7, 6.8</td></tr>
            <tr><td>E12</td><td>12</td><td>±10 %</td><td>1.0, 1.2, 1.5, 1.8, 2.2, 2.7, …</td></tr>
            <tr><td>E24</td><td>24</td><td>±5 %</td><td>1.0, 1.1, 1.2, 1.3, 1.5, 1.6, …</td></tr>
          </tbody>
        </table>
        <p>
          For example, E6 base values are <code>1.0, 1.5, 2.2, 3.3, 4.7, 6.8</code>. Multiplied
          across decades (×1, ×10, ×100, … ×10⁸) this gives the full catalogue from 1&nbsp;Ω to
          100&nbsp;MΩ. You can also enter any custom set of values.
        </p>
      </section>

      <section className="how-it-works__section">
        <h2>Combining Resistors</h2>
        <p>Two fundamental network topologies exist:</p>
        <div className="how-it-works__formulas">
          <div className="how-it-works__formula-card">
            <span className="how-it-works__formula-label">Series</span>
            <code className="how-it-works__formula">R = R₁ + R₂</code>
            <p>Resistances add. The total is always greater than either component.</p>
          </div>
          <div className="how-it-works__formula-card">
            <span className="how-it-works__formula-label">Parallel</span>
            <code className="how-it-works__formula">R = R₁ × R₂ / (R₁ + R₂)</code>
            <p>The combined resistance is always less than the smaller component.</p>
          </div>
        </div>
        <p>
          These two operations can be applied <em>recursively</em>, so a network of five resistors
          might be, for example, two groups wired in series where one group is itself two resistors
          in parallel.
        </p>
      </section>

      <section className="how-it-works__section">
        <h2>The Search Algorithm</h2>
        <p>
          Finding the best combination is a <strong>layer-by-layer (BFS-style) search</strong> over
          all possible resistor networks, where each layer corresponds to a fixed number of
          resistors used.
        </p>

        <h3>Layer 1 — Single Resistors</h3>
        <p>
          Start with every distinct input value as a leaf node. If one already matches the target
          within the chosen tolerance, the search stops immediately.
        </p>

        <h3>Layer k — Combining Smaller Networks</h3>
        <p>
          For every way to split <em>k</em> resistors into two groups of size <em>i</em> and{" "}
          <em>j = k − i</em>, take all networks from layer <em>i</em> and combine them with all
          networks from layer <em>j</em> — both in series and in parallel. Each valid combination
          becomes a candidate node for layer <em>k</em>.
        </p>
        <p>
          To avoid redundant work the algorithm tracks all <strong>distinct resistance values
          already reached</strong>. If a new combination produces a value that was already found
          with fewer parts, it is discarded. Deduplication uses logarithmic bucketing so that tiny
          floating-point differences don't create spurious duplicates.
        </p>
        <p>
          The search stops at the first layer <em>k</em> where any result falls within tolerance —
          guaranteeing the answer uses the <strong>minimum number of resistors</strong>.
        </p>

        <h3>Pruning for the Multi-Result Search</h3>
        <p>
          When searching for <em>all</em> good networks (not just the single best), the candidate
          pool can grow large. To keep the search tractable, each layer is pruned before being used
          to build the next: values are grouped into logarithmic buckets by proximity to the target,
          and only the closest few candidates per bucket are kept (up to 256 nodes per layer). This
          focuses exploration on promising sub-networks while discarding redundant ones.
        </p>
      </section>

      <section className="how-it-works__section">
        <h2>Ranking the Results</h2>
        <p>
          After collecting all valid networks within tolerance, the app organises them into a
          <strong> trade-off ranking</strong> rather than a flat list.
        </p>

        <h3>Pareto Tiers</h3>
        <p>
          Results are grouped by resistor count. A tier (count group) is only kept if its best
          accuracy is genuinely better than every simpler tier — forming a{" "}
          <strong>Pareto front</strong> of complexity vs. precision. Tiers that add more resistors
          without improving accuracy are dropped.
        </p>

        <h3>The Knee Point</h3>
        <p>
          The app automatically highlights a <strong>recommended tier</strong> using a
          knee-detection algorithm:
        </p>
        <ol>
          <li>Both axes (resistor count and absolute error) are normalised to [0, 1].</li>
          <li>A straight reference line is drawn from the simplest to the most accurate tier.</li>
          <li>
            The tier with the greatest <em>perpendicular distance</em> from that line is selected
            as the knee.
          </li>
        </ol>
        <p>
          The knee represents the point of <strong>diminishing returns</strong>: beyond it, adding
          more resistors yields proportionally smaller accuracy gains. It is highlighted as the
          default recommendation, though all Pareto-optimal tiers are shown so you can choose
          differently.
        </p>
      </section>

      <section className="how-it-works__section">
        <h2>Worked Example</h2>
        <p>
          <strong>Target: 660&nbsp;Ω</strong> from E12 values.
        </p>
        <table className="how-it-works__table">
          <thead>
            <tr>
              <th>Network</th>
              <th>Resistors</th>
              <th>Value</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            <tr><td><code>680</code></td><td>1</td><td>680&nbsp;Ω</td><td>+3.0 %</td></tr>
            <tr><td><code>330 + 330</code></td><td>2</td><td>660&nbsp;Ω</td><td>0 %</td></tr>
          </tbody>
        </table>
        <p>
          A single 680&nbsp;Ω resistor is close but not exact. Two resistors in series give a
          perfect match. The algorithm identifies 2-resistor as the knee: one extra part, zero
          error — a clear win.
        </p>
      </section>

      <footer className="how-it-works__footer">
        <button className="how-it-works__back" onClick={onBack} type="button">
          &lt; Back to Calculator
        </button>
      </footer>
    </article>
  );
}

export default HowItWorksPage;
