import React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export const statusOptions = [
    { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-800' },
    //{ value: 'Contacted', label: 'Contacted', color: 'bg-purple-100 text-purple-800' },
    { value: 'followup', label: 'Followup', color: 'bg-yellow-100 text-yellow-800' },
    //{ value: 'qualified', label: 'Qualified', color: 'bg-green-100 text-green-800' },
    { value: 'Not Interested', label: 'Not Interested', color: 'bg-red-100 text-red-800' },
    { value: 'Call Back', label: 'Call Back', color: 'bg-orange-100 text-orange-800' },
    { value: 'Switch off', label: 'Switch off', color: 'bg-gray-100 text-gray-800' },
    { value: 'RNR', label: 'RNR', color: 'bg-indigo-100 text-indigo-800' },
    //{ value: 'won', label: 'won', color: 'bg-emerald-100 text-emerald-800' }
];

export const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
        new: 'bg-blue-100 text-blue-800',
        Contacted: 'bg-purple-100 text-purple-800',
        qualified: 'bg-green-100 text-green-800',
        followup: 'bg-yellow-100 text-yellow-800',
        negotiation: 'bg-orange-100 text-orange-800',
        won: 'bg-emerald-100 text-emerald-800',
        lost: 'bg-red-100 text-red-800',
        'Not Interested': 'bg-red-100 text-red-800',
        'Call Back': 'bg-orange-100 text-orange-800',
        'Switch off': 'bg-gray-100 text-gray-800',
        'RNR': 'bg-indigo-100 text-indigo-800',
        'client': 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
};

interface FilterOption {
    value: string;
    label: string;
}

interface FilterProps {
    value: string;
    onChange: (value: string) => void;
    options: FilterOption[];
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    width?: string;
}

export const CampaignFilter: React.FC<FilterProps> = ({
    value,
    onChange,
    options,
    placeholder = "Select campaign...",
    searchPlaceholder = "Search campaign...",
    emptyMessage = "No campaign found.",
    width = "w-full sm:w-[260px]"
}) => {
    const [open, setOpen] = React.useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={`${width} justify-between`}
                >
                    {value
                        ? options.find((option) => option.value === value)?.label
                        : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className={`${width} p-0`}>
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        <CommandEmpty>{emptyMessage}</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.value}
                                    onSelect={(currentValue) => {
                                        onChange(currentValue === value ? "" : currentValue);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === option.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

export const SourceFilter: React.FC<FilterProps> = ({
    value,
    onChange,
    options,
    placeholder = "Select Source...",
    searchPlaceholder = "Search Source...",
    emptyMessage = "No source found.",
    width = "w-full sm:w-[200px]"
}) => {
    const [open, setOpen] = React.useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={`${width} justify-between`}
                >
                    {value
                        ? options.find((option) => option.value === value)?.label
                        : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className={`${width} p-0`}>
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        <CommandEmpty>{emptyMessage}</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.value}
                                    onSelect={(currentValue) => {
                                        onChange(currentValue === value ? "" : currentValue);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === option.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

export const AssignedUserFilter: React.FC<FilterProps> = ({
    value,
    onChange,
    options,
    placeholder = "Select user...",
    searchPlaceholder = "Search user...",
    emptyMessage = "No user found.",
    width = "w-full sm:w-[200px]"
}) => {
    const [open, setOpen] = React.useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={`${width} justify-between`}
                >
                    {value
                        ? options.find((option) => option.value === value)?.label
                        : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className={`${width} p-0`}>
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        <CommandEmpty>{emptyMessage}</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.value}
                                    onSelect={(currentValue) => {
                                        onChange(currentValue === value ? "" : currentValue);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === option.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};
