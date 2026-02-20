def parseTime(stderr: str) -> list[str]:
    start = stderr.find("STATS=")
    end   = stderr.find("\n", start)

    if start != -1 and end != -1:
        try:
            stats = stderr[start:end].split("=")
            stderr = stderr[:start] + stderr[end + 1:]
            if len(stats) == 3:
                return [float(stats[1]), round(int(stats[2]) / 1024, 2), stderr]
        except Exception as e:
            pass
    return [0.00, 0.00, stderr]