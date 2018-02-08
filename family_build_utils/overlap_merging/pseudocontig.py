from sortedcontainers import SortedList


class Pseudocontig:
    def __init__(self, name: str, query_id: str, start: int, end: int, complete: bool, reverse: bool):
        self.names = []
        if not complete:
            name = name + '*'
        if reverse:
            name = name + '-'
        self.names.append(name)
        self.id = query_id
        self.start = start
        self.end = end

    def extend(self, name: str, end: int, complete: bool, reverse: bool):
        if not complete:
            name = name + '*'
        if reverse:
            name = name + '-'
        self.names.append(name)
        self.end = end

    def real_name(self) -> str:
        ordered = SortedList([a.replace('-', '') for a in self.names])
        return '__'.join(map(str, ordered))

    def orientation(self) -> str:
        head = SortedList(self.names)[0]
        return '-' if head.endswith('-') else '+'

    def __repr__(self):
        return ','.join(
            (self.id,
             str(self.start),
             str(self.end),
             self.real_name(),
             self.orientation(),
             '__'.join(map(str, self.names)),
             str(self.end - self.start + 1))
        )
