from services.inference_engine import engine


def predict_flow(
    source_ip: str,
    destination_ip: str,
    flow_features: list[float],
):
    return engine.detect_flow(
        source_ip=source_ip,
        destination_ip=destination_ip,
        flow_features=flow_features,
    )