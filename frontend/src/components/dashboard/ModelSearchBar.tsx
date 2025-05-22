"use client";

import { useState } from "react";
import {
  Input,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Badge,
} from "@/components/ui";
import { Search, SlidersHorizontal, X } from "lucide-react";

interface ModelSearchBarProps {
  onSearch: (query: string) => void;
}

export function ModelSearchBar({ onSearch }: ModelSearchBarProps) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<string[]>([]);

  const handleSearch = () => {
    onSearch(query);
  };

  const addFilter = (filter: string) => {
    if (!filters.includes(filter)) {
      setFilters([...filters, filter]);
    }
  };

  const removeFilter = (filter: string) => {
    setFilters(filters.filter((f) => f !== filter));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search models..."
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setQuery(e.target.value)
            }
            onKeyPress={handleKeyPress}
            className="pl-8"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Filter By</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => addFilter("Computer Vision")}>
              Computer Vision
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => addFilter("NLP")}>
              Natural Language Processing
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => addFilter("Speech")}>
              Speech Recognition
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => addFilter("PyTorch")}>
              PyTorch
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => addFilter("TensorFlow")}>
              TensorFlow
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => addFilter("Production Ready")}>
              Production Ready
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => addFilter("Experimental")}>
              Experimental
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button onClick={handleSearch}>Search</Button>
      </div>

      {filters.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {filters.map((filter) => (
            <Badge
              key={filter}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {filter}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => removeFilter(filter)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
