import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarPlus, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { useAuth } from "../hooks/useAuth";
import api from "../lib/api";
import { Event } from "../types";

const eventSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  location: z.string().min(2),
  capacity: z.coerce.number().positive(),
  startDate: z.string(),
  endDate: z.string(),
});

type EventForm = z.infer<typeof eventSchema>;

export const EventsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: events, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => (await api.get<Event[]>("/events")).data,
  });

  const createForm = useForm<EventForm>({ resolver: zodResolver(eventSchema) });

  const createMutation = useMutation({
    mutationFn: async (payload: EventForm) => (await api.post("/events", payload)).data,
    onSuccess: () => {
      toast.success("Evento criado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["events"] });
      createForm.reset();
    },
    onError: () => toast.error("Não foi possível criar o evento"),
  });

  const bookMutation = useMutation({
    mutationFn: async (eventId: string) => (await api.post("/events/book", { eventId })).data,
    onSuccess: () => {
      toast.success("Reserva confirmada");
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: () => toast.error("Não foi possível reservar a vaga"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Agenda de eventos</h2>
          <p className="text-sm text-muted-foreground">Reserve espaços compartilhados e acompanhe disponibilidade.</p>
        </div>
      </div>

      {user?.role !== "MORADOR" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarPlus className="h-5 w-5" /> Novo evento
            </CardTitle>
            <CardDescription>Cadastre reuniões, festas ou manutenções com controle de vagas.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={createForm.handleSubmit((values) => createMutation.mutate(values))}>
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input id="title" placeholder="Reunião de condomínio" {...createForm.register("title")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Local</Label>
                <Input id="location" placeholder="Salão de festas" {...createForm.register("location")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacidade</Label>
                <Input id="capacity" type="number" min={1} {...createForm.register("capacity")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input id="description" placeholder="Detalhes adicionais" {...createForm.register("description")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Início</Label>
                <Input id="startDate" type="datetime-local" {...createForm.register("startDate")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Fim</Label>
                <Input id="endDate" type="datetime-local" {...createForm.register("endDate")} />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Salvando..." : "Criar evento"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Agenda completa</CardTitle>
          <CardDescription>Detalhes de reservas e participantes confirmados.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evento</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Vagas</TableHead>
                <TableHead>Organizador</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events?.map((event) => {
                const spotsLeft = event.capacity - event.bookings.length;
                const alreadyBooked = event.bookings.some((booking) => booking.resident.id === user?.id);
                return (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>{event.location}</TableCell>
                    <TableCell>
                      {format(new Date(event.startDate), "dd/MM HH:mm", { locale: ptBR })} -
                      {" "}
                      {format(new Date(event.endDate), "dd/MM HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={spotsLeft > 0 ? "outline" : "secondary"}>
                        {event.bookings.length}/{event.capacity}
                      </Badge>
                    </TableCell>
                    <TableCell>{event.createdBy.name}</TableCell>
                    <TableCell className="text-right">
                      {user?.role === "MORADOR" ? (
                        <Button
                          size="sm"
                          disabled={spotsLeft <= 0 || alreadyBooked || bookMutation.isPending}
                          onClick={() => bookMutation.mutate(event.id)}
                        >
                          {alreadyBooked ? (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" /> Reservado
                            </>
                          ) : (
                            "Reservar"
                          )}
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {event.bookings.length} participantes confirmados
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {!isLoading && events?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhum evento cadastrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
