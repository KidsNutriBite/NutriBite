import time
import threading
from typing import Callable, Any, Dict

class CircuitBreakerOpenException(Exception):
    """Exception raised when the circuit breaker is in OPEN state and blocks requests."""
    pass

class CircuitBreaker:
    def __init__(self, failure_threshold: int = 5, recovery_timeout: float = 10.0):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        
        # Initial State: CLOSED
        self.state = "CLOSED"
        self.failure_count = 0
        self.last_state_change = time.time()
        
        self.lock = threading.Lock()

    def trip(self):
        self.state = "OPEN"
        self.last_state_change = time.time()
        print(f"[WARN] Circuit Breaker TRIPPED to OPEN. Recovery cooldown: {self.recovery_timeout}s")

    def reset(self):
        self.state = "CLOSED"
        self.failure_count = 0
        self.last_state_change = time.time()
        print("[INFO] Circuit Breaker RESET to CLOSED. System restored.")

    def half_open(self):
        self.state = "HALF-OPEN"
        self.last_state_change = time.time()
        print("[INFO] Circuit Breaker entered HALF-OPEN state. Testing connection...")

    def observe_failure(self):
        with self.lock:
            self.failure_count += 1
            if self.state in ["CLOSED", "HALF-OPEN"] and self.failure_count >= self.failure_threshold:
                self.trip()

    def observe_success(self):
        with self.lock:
            if self.state == "HALF-OPEN":
                self.reset()
            elif self.state == "CLOSED":
                self.failure_count = 0

    def check_state(self):
        """
        Dynamically updates circuit breaker state based on time rules.
        """
        with self.lock:
            now = time.time()
            if self.state == "OPEN" and (now - self.last_state_change > self.recovery_timeout):
                self.half_open()

    def execute(self, func: Callable, *args, **kwargs) -> Any:
        """
        Executes target function, wrapping it in state checking and failure counts.
        """
        self.check_state()
        
        if self.state == "OPEN":
            raise CircuitBreakerOpenException("Circuit is currently open. Request blocked.")
            
        try:
            res = func(*args, **kwargs)
            self.observe_success()
            return res
        except Exception as e:
            self.observe_failure()
            raise e

def retry_with_backoff(func: Callable, retries: int = 3, backoff_in_seconds: float = 1.0, *args, **kwargs) -> Any:
    """
    Executes func with exponential backoff retry policies.
    """
    for attempt in range(retries):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            if attempt == retries - 1:
                raise e
            sleep_time = backoff_in_seconds * (2 ** attempt)
            print(f"[WARN] Attempt {attempt + 1} failed: {str(e)}. Retrying in {sleep_time}s...")
            time.sleep(sleep_time)
