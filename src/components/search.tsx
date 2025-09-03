import { createSignal, Show, onMount, onCleanup } from "solid-js";
import { A } from "@solidjs/router";
import { parkdata } from "~/data/parkdata"; // Or parkdata → rename accordingly

export default function SearchableParks() {
  const [query, setQuery] = createSignal("");
  const [isOpen, setIsOpen] = createSignal(false);

  // Filter parks
  const results = () => {
    const q = query().trim().toLowerCase();
    if (!q) return parkdata; // Show all parks when empty (like YouTube does with suggestions)
    return parkdata.filter((p) => p.name.toLowerCase().includes(q));
  };

  // Close dropdown if clicked outside
  onMount(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".search-container")) {
        setIsOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    onCleanup(() => document.removeEventListener("click", handleClickOutside));
  });

  return (
    <div class="relative w-full max-w-md search-container">
      {/* Search bar */}
      <div class="flex items-center border rounded px-2 py-1 bg-white">
        <input
          type="text"
          placeholder="Search parks..."
          value={query()}
          onFocus={() => setIsOpen(true)} // Open when focused
          onInput={(e) => setQuery(e.currentTarget.value)} // Update query but keep dropdown open
          class="flex-1 p-2 outline-none"
        />

        {/* Clear (cancel) button */}
        <Show when={query()}>
          <button
            onClick={() => setQuery("")}
            class="ml-2 text-gray-500 hover:text-black"
            aria-label="Clear search"
          >
            ✖
          </button>
        </Show>
      </div>

      {/* Dropdown list */}
      <Show when={isOpen()}>
        <div
          class="absolute top-full left-0 right-0 mt-1 bg-white border rounded shadow-lg max-h-72 overflow-y-auto z-50"
          onMouseDown={(e) => e.preventDefault()} // Prevent losing focus before click
        >
          {results().length > 0 ? (
            results().map((park) => (
              <A
                href={`/parks/${park.id}`}
                class="block px-3 py-2 hover:bg-gray-100"
              >
                {park.name}
              </A>
            ))
          ) : (
            <div class="px-3 py-2 text-gray-500">No results found</div>
          )}
        </div>
      </Show>
    </div>
  );
}
