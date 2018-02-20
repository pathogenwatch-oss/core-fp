from sortedcontainers import SortedList


# Simple helper class for dealing with the merged families aka pseudocontigs.

class Pseudocontig:
    def __init__(self, name: str, query_id: str, start: int, end: int, complete: float, reverse: bool):
        self.names = []
        if complete != 1.0:
            name = name + '*'
        if reverse:
            name = name + '-'
        self.names.append(name)
        self.id = query_id
        self.start = start
        self.end = end

    def extend(self, name: str, end: int, complete: float, reverse: bool):
        if complete != 1.0:
            name = name + '*'
        if reverse:
            name = name + '-'
        self.names.append(name)
        self.end = end

    def real_name(self) -> str:
        # Real name is the same no matter what order the family IDs are read in.
        ordered = SortedList([a.replace('-', '') for a in self.names])
        return '__'.join(map(str, ordered))

    def orientation(self) -> str:
        # Orientation is chosen by picking the first family name alphabetically and using the orientation of that gene.
        head = SortedList(self.names)[0]
        return '-' if head.endswith('-') else '+'

    def __repr__(self):
        return '\\t'.join(
            (self.id,
             str(self.start),
             str(self.end),
             self.real_name(),
             self.orientation(),
             '__'.join(map(str, self.names)),
             str(self.end - self.start + 1))
        )

    def csv(self):
        print(self.id,
              str(self.start),
              str(self.end),
              self.real_name(),
              self.orientation(),
              '__'.join(map(str, self.names)),
              str(self.end - self.start + 1),
              sep='\t'
              )
