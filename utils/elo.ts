type EloTournament = {
  config: Config;
  entities: Set<string>;
  comparisons: Array<Comparison>;
};

type Config = {
  initialRating: number;
  denominator: number;
  thresholds: Array<number>;
  kFactors: Array<number>;
};

type Comparison = {
  id: string;
  entities: [string, string];
  result: number;
  date: string;
};

/**
 * Returns an updated aRating.
 * @param aRating Current rating of a.
 * @param bRating Current rating of b.
 * @param actualResult 1 = win for a, 0.5 = draw, 0 = win for b.
 * @param denominator Whatever magic number you want. 400 is popular.
 * @param kFactor Maximum possilbe rating change.
 */
const update = (
  aRating: number,
  bRating: number,
  actualResult: number,
  denominator: number,
  kFactor: number
) =>
  aRating +
  kFactor *
    (actualResult - 1 / (1 + Math.pow(10, (bRating - aRating) / denominator)));

const findKFactor = (
  comparisons: number,
  thresholds: Array<number>,
  kFactors: Array<number>
) => {
  let index = 0;
  while (index < thresholds.length && comparisons >= thresholds[index]) {
    index += 1;
  }
  return kFactors[index];
};

const calculateStats = (tournament: EloTournament) => {
  const { denominator, initialRating } = tournament.config;
  const result: Record<string, { comparisons: number; rating: number }> = {};

  for (let entity of tournament.entities) {
    result[entity] = {
      comparisons: 0,
      rating: initialRating,
    };
  }

  for (let comparison of tournament.comparisons) {
    const a = result[comparison.entities[0]];
    const b = result[comparison.entities[1]];

    if (!a) {
      throw Error(
        `Comparison references unknown entity "${comparison.entities[0]}".`
      );
    }

    if (!b) {
      throw Error(
        `Comparison references unknown entity "${comparison.entities[1]}".`
      );
    }

    a.rating = update(
      a.rating,
      b.rating,
      comparison.result,
      denominator,
      findKFactor(
        a.comparisons,
        tournament.config.thresholds,
        tournament.config.kFactors
      )
    );
    b.rating = update(
      b.rating,
      a.rating,
      1 - comparison.result,
      denominator,
      findKFactor(
        b.comparisons,
        tournament.config.thresholds,
        tournament.config.kFactors
      )
    );

    a.comparisons = a.comparisons + 1;
    b.comparisons = b.comparisons + 1;
  }

  return result;
};

export { calculateStats };
export type { Comparison, EloTournament };
